package com.shrihari.mail;

import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.mail.MessagingException;

@Service
public class EmailCampaignService {
	private static final Pattern EMAIL_PATTERN =
			Pattern.compile("^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$",
					Pattern.CASE_INSENSITIVE);

	private final JavaMailSender mailSender;
	private final String from;
	private final int maxRecipients;
	private final long maxCsvBytes;
	private final long maxAttachmentBytes;

	public EmailCampaignService(
			JavaMailSender mailSender,
			@Value("${app.mail.from:}") String from,
			@Value("${app.mail.max-recipients:500}") int maxRecipients,
			@Value("${app.mail.max-csv-bytes:2097152}") long maxCsvBytes,
			@Value("${app.mail.max-attachment-bytes:10485760}") long maxAttachmentBytes) {
		this.mailSender = mailSender;
		this.from = from;
		this.maxRecipients = maxRecipients;
		this.maxCsvBytes = maxCsvBytes;
		this.maxAttachmentBytes = maxAttachmentBytes;
	}

	public CsvPreview preview(MultipartFile csv) {
		return parseRecipients(csv);
	}

	public SendResult send(MultipartFile csv, String subject, String body, MultipartFile attachment) {
		if (!StringUtils.hasText(from)) {
			throw new CampaignException(503, "Email sender is not configured. Set MAIL_FROM and SMTP settings.");
		}
		if (!StringUtils.hasText(subject) || subject.length() > 200) {
			throw new CampaignException(400, "Subject must contain 1 to 200 characters.");
		}
		if (!StringUtils.hasText(body) || body.length() > 10000) {
			throw new CampaignException(400, "Message must contain 1 to 10,000 characters.");
		}
		if (attachment != null && !attachment.isEmpty() && attachment.getSize() > maxAttachmentBytes) {
			throw new CampaignException(413, "Attachment exceeds the 10 MB limit.");
		}

		CsvPreview preview = parseRecipients(csv);
		if (preview.recipients().isEmpty()) {
			throw new CampaignException(400, "No valid email addresses were found in the CSV file.");
		}

		int sent = 0;
		List<String> failures = new ArrayList<>();
		for (String recipient : preview.recipients()) {
			try {
				sendOne(recipient, subject, body, attachment);
				sent++;
			} catch (MailException | MessagingException | IOException ex) {
				failures.add(recipient);
			}
		}
		return new SendResult(preview.recipients().size(), sent, failures.size(),
				preview.invalidRows().size(), failures);
	}

	private void sendOne(String recipient, String subject, String body, MultipartFile attachment)
			throws MessagingException, IOException {
		var message = mailSender.createMimeMessage();
		var helper = new MimeMessageHelper(message, attachment != null && !attachment.isEmpty(), StandardCharsets.UTF_8.name());
		helper.setFrom(from);
		helper.setTo(recipient);
		helper.setSubject(subject);
		helper.setText(body, false);
		if (attachment != null && !attachment.isEmpty()) {
			String filename = StringUtils.cleanPath(StringUtils.hasText(attachment.getOriginalFilename())
					? attachment.getOriginalFilename() : "attachment");
			filename = filename.replace('\\', '/');
			filename = filename.substring(filename.lastIndexOf('/') + 1).replaceAll("[\\r\\n]", "");
			if (!StringUtils.hasText(filename)) {
				filename = "attachment";
			}
			helper.addAttachment(filename, new ByteArrayResource(attachment.getBytes()));
		}
		mailSender.send(message);
	}

	private CsvPreview parseRecipients(MultipartFile csv) {
		if (csv == null || csv.isEmpty()) {
			throw new CampaignException(400, "Upload a non-empty CSV file.");
		}
		if (csv.getSize() > maxCsvBytes) {
			throw new CampaignException(413, "CSV file exceeds the 2 MB limit.");
		}

		List<String[]> rows = new ArrayList<>();
		try (InputStreamReader reader = new InputStreamReader(csv.getInputStream(), StandardCharsets.UTF_8);
				CSVParser parser = CSVFormat.DEFAULT.builder()
						.setIgnoreEmptyLines(true)
						.setTrim(true)
						.get()
						.parse(reader)) {
			for (CSVRecord record : parser) {
				String[] row = new String[record.size()];
				for (int i = 0; i < record.size(); i++) {
					row[i] = record.get(i).trim();
				}
				rows.add(row);
			}
		} catch (IOException ex) {
			throw new CampaignException(400, "The CSV file could not be read. Check its encoding and formatting.");
		}
		if (rows.isEmpty()) {
			throw new CampaignException(400, "The CSV file does not contain any rows.");
		}

		int emailColumn = 0;
		int firstDataRow = 0;
		for (int i = 0; i < rows.get(0).length; i++) {
			String header = rows.get(0)[i].toLowerCase(Locale.ROOT).replaceAll("[^a-z]", "");
			if (header.equals("email") || header.equals("emailaddress")) {
				emailColumn = i;
				firstDataRow = 1;
				break;
			}
		}

		var recipients = new LinkedHashMap<String, String>();
		List<CsvPreview.InvalidRecipient> invalid = new ArrayList<>();
		int totalRows = 0;
		for (int i = firstDataRow; i < rows.size(); i++) {
			String[] row = rows.get(i);
			if (row.length == 1 && row[0].isBlank()) {
				continue;
			}
			totalRows++;
			String value = emailColumn < row.length ? row[emailColumn].trim() : "";
			if (value.length() > 254 || !EMAIL_PATTERN.matcher(value).matches()) {
				invalid.add(new CsvPreview.InvalidRecipient(i + 1, value));
			} else {
				recipients.putIfAbsent(value.toLowerCase(Locale.ROOT), value);
				if (recipients.size() > maxRecipients) {
					throw new CampaignException(400, "This CSV exceeds the limit of " + maxRecipients + " unique recipients.");
				}
			}
		}
		return new CsvPreview(totalRows, List.copyOf(recipients.values()), List.copyOf(invalid),
				totalRows - invalid.size() - recipients.size());
	}
}
