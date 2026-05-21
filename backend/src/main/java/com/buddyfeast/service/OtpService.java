package com.buddyfeast.service;

import com.buddyfeast.entity.OtpRecord;
import com.buddyfeast.exception.AppException;
import com.buddyfeast.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int MAX_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpRepository otpRepository;
    private final EmailService emailService;

    @Transactional
    public void generateAndSendOtp(String identifier, OtpRecord.IdentifierType type) {
        // Invalidate any existing OTPs for this identifier
        otpRepository.deleteAllByIdentifier(identifier);

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        OtpRecord record = OtpRecord.builder()
                .identifier(identifier)
                .identifierType(type)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .attempts(0)
                .used(false)
                .build();

        otpRepository.save(record);

        if (type == OtpRecord.IdentifierType.EMAIL) {
            emailService.sendOtpEmail(identifier, code);
        } else {
            // TODO: integrate SMS provider (e.g. Twilio) for phone OTPs
            log.info("Phone OTP requested for {} — SMS not yet wired", identifier);
        }

        log.info("OTP dispatched to {} ({})", identifier, type);
    }

    @Transactional
    public void verifyOtp(String identifier, String code) {
        OtpRecord record = otpRepository
                .findTopByIdentifierAndUsedFalseOrderByCreatedAtDesc(identifier)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "No active OTP found. Please request a new one."));

        if (record.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException(HttpStatus.GONE,
                    "OTP has expired. Please request a new one.");
        }

        if (record.getAttempts() >= MAX_ATTEMPTS) {
            throw new AppException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many failed attempts. Please request a new OTP.");
        }

        if (!record.getCode().equals(code)) {
            record.setAttempts(record.getAttempts() + 1);
            otpRepository.save(record);
            int remaining = MAX_ATTEMPTS - record.getAttempts();
            String msg = remaining > 0
                    ? "Incorrect code. " + remaining + " attempt(s) remaining."
                    : "Too many failed attempts. Please request a new OTP.";
            throw new AppException(HttpStatus.BAD_REQUEST, msg);
        }

        record.setUsed(true);
        otpRepository.save(record);
    }
}
