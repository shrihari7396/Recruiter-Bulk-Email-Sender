package com.shrihari.mail;

import java.util.List;

public record CsvPreview(
		int totalRows,
		List<String> recipients,
		List<InvalidRecipient> invalidRows,
		int duplicateCount) {
	public record InvalidRecipient(int row, String value) {}
}
