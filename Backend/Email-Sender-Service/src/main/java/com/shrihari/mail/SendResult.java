package com.shrihari.mail;

import java.util.List;

public record SendResult(
		int attempted,
		int sent,
		int failed,
		int invalidRowsSkipped,
		List<String> failedRecipients) {}
