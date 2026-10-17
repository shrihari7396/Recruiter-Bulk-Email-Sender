package com.shrihari.mail;

import java.util.Map;

import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class CampaignExceptionHandler {
	@ExceptionHandler(CampaignException.class)
	public ResponseEntity<Map<String, String>> handleCampaignException(CampaignException exception) {
		return ResponseEntity.status(HttpStatusCode.valueOf(exception.getStatus()))
				.body(Map.of("message", exception.getMessage()));
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<Map<String, String>> handleMaxUploadSize() {
		return ResponseEntity.status(413).body(Map.of("message", "The uploaded files exceed the allowed size."));
	}
}
