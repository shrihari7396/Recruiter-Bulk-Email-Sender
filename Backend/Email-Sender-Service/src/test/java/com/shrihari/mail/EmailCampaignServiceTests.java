package com.shrihari.mail;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.multipart.MultipartFile;

class EmailCampaignServiceTests {
	private final EmailCampaignService service =
			new EmailCampaignService(mock(JavaMailSender.class), "sender@example.com", 500, 2_097_152, 10_485_760);

	@Test
	void previewFindsEmailColumnAndRemovesDuplicates() {
		var csv = csv("Name,Email\nAva,ava@example.com\nSam,not-an-email\nAva,AVA@example.com\n");

		CsvPreview preview = service.preview(csv);

		assertThat(preview.totalRows()).isEqualTo(3);
		assertThat(preview.recipients()).containsExactly("ava@example.com");
		assertThat(preview.invalidRows()).containsExactly(new CsvPreview.InvalidRecipient(3, "not-an-email"));
		assertThat(preview.duplicateCount()).isEqualTo(1);
	}

	@Test
	void previewAcceptsAPlainOneColumnList() {
		var csv = csv("hello@example.com\nteam@example.org\n");

		CsvPreview preview = service.preview(csv);

		assertThat(preview.recipients()).containsExactly("hello@example.com", "team@example.org");
		assertThat(preview.invalidRows()).isEmpty();
	}

	private MultipartFile csv(String content) {
		return new TestMultipartFile(content.getBytes(StandardCharsets.UTF_8));
	}

	private record TestMultipartFile(byte[] bytes) implements MultipartFile {
		@Override
		public String getName() {
			return "csv";
		}

		@Override
		public String getOriginalFilename() {
			return "recipients.csv";
		}

		@Override
		public String getContentType() {
			return "text/csv";
		}

		@Override
		public boolean isEmpty() {
			return bytes.length == 0;
		}

		@Override
		public long getSize() {
			return bytes.length;
		}

		@Override
		public byte[] getBytes() {
			return bytes.clone();
		}

		@Override
		public InputStream getInputStream() {
			return new ByteArrayInputStream(bytes);
		}

		@Override
		public void transferTo(File destination) throws IOException {
			java.nio.file.Files.write(destination.toPath(), bytes);
		}
	}
}
