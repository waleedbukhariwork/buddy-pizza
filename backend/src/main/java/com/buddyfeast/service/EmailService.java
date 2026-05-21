package com.buddyfeast.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private static final String RESEND_API = "https://api.resend.com/emails";

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${resend.from}")
    private String fromAddress;

    private final RestTemplate restTemplate;

    public void sendOtpEmail(String toEmail, String otp) {
        String html = buildOtpEmailHtml(otp);

        Map<String, Object> body = Map.of(
                "from", fromAddress,
                "to", List.of(toEmail),
                "subject", "Your Buddy Feast verification code",
                "html", html
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    RESEND_API,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    (Class<Map<String, Object>>) (Class<?>) Map.class
            );
            Map<String, Object> resBody = response.getBody();
            log.info("OTP email sent to {} — Resend id: {}", toEmail,
                    resBody != null ? resBody.get("id") : "unknown");
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send verification email. Please try again.");
        }
    }

    private String buildOtpEmailHtml(String otp) {
        String[] digits = otp.split("");
        StringBuilder boxes = new StringBuilder();
        for (String d : digits) {
            boxes.append(
                    "<td style=\"padding:0 5px\">" +
                    "<div style=\"width:48px;height:56px;background:#fff;border:2px solid #e8431f;" +
                    "border-radius:10px;text-align:center;line-height:56px;" +
                    "font-size:26px;font-weight:800;color:#231f20;font-family:monospace\">" +
                    d + "</div></td>"
            );
        }

        return "<!DOCTYPE html><html><body style=\"margin:0;padding:0;background:#faf9f7;font-family:sans-serif\">" +
               "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td align=\"center\" style=\"padding:40px 16px\">" +
               "<table width=\"520\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#ffffff;border-radius:20px;" +
               "overflow:hidden;box-shadow:0 8px 30px rgba(35,31,32,.1)\">" +

               // Header
               "<tr><td style=\"background:#231f20;padding:32px 40px;text-align:center\">" +
               "<p style=\"margin:0;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#e8431f\">Buddy Feast</p>" +
               "<p style=\"margin:8px 0 0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-.02em\">Verify your account</p>" +
               "</td></tr>" +

               // Body
               "<tr><td style=\"padding:40px\">" +
               "<p style=\"margin:0 0 8px;font-size:15px;color:#231f20\">Here is your one-time verification code:</p>" +
               "<p style=\"margin:0 0 24px;font-size:13px;color:#9e9e9e\">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>" +
               "<table cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 auto 32px\">" +
               "<tr>" + boxes + "</tr></table>" +
               "<p style=\"margin:0;font-size:13px;color:#9e9e9e;line-height:1.6\">" +
               "If you didn't create a Buddy Feast account, you can safely ignore this email.</p>" +
               "</td></tr>" +

               // Footer
               "<tr><td style=\"padding:20px 40px;border-top:1px solid #f0efed;text-align:center\">" +
               "<p style=\"margin:0;font-size:12px;color:#bdbdbd\">&copy; 2024 Buddy Feast &middot; Multan, PK</p>" +
               "</td></tr>" +

               "</table></td></tr></table></body></html>";
    }
}
