package com.shrihari.mail;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/campaigns")
@Validated
public class EmailCampaignController {
	private final EmailCampaignService campaignService;

	public EmailCampaignController(EmailCampaignService campaignService) {
		this.campaignService = campaignService;
	}

	@PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public CsvPreview preview(@RequestPart("csv") MultipartFile csv) {
		return campaignService.preview(csv);
	}

	@PostMapping(value = "/send", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public SendResult send(
			@RequestPart("csv") MultipartFile csv,
			@RequestPart("subject") @NotBlank @Size(max = 200) String subject,
			@RequestPart("body") @NotBlank @Size(max = 10000) String body,
			@RequestPart(value = "attachment", required = false) MultipartFile attachment) {
		return campaignService.send(csv, subject, body, attachment);
	}
}
