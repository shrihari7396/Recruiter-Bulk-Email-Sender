package com.shrihari.mail;

public class CampaignException extends RuntimeException {
	private final int status;

	public CampaignException(int status, String message) {
		super(message);
		this.status = status;
	}

	public int getStatus() {
		return status;
	}
}
