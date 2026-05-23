package com.buddyfeast.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.HtmlUtils;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

        sendEmail(
                toEmail,
                "Your Buddy Feast verification code",
                html,
                "OTP email",
                "Failed to send verification email. Please try again."
        );
    }

    public void sendOrderAcceptedEmail(String toEmail, String customerName, String orderNumber,
                                       List<String> itemSummaries, Double total) {
        String html = buildOrderStatusEmailHtml(
                customerName,
                orderNumber,
                itemSummaries,
                total,
                "Order accepted",
                "Our kitchen has started preparing ",
                "Great news - your order has been accepted by Buddy Feast and is now being prepared with care. " +
                        "We will keep things moving and update you as soon as it is ready for the next step."
        );

        sendEmail(
                toEmail,
                "Your Buddy Feast order has been accepted",
                html,
                "Order accepted email",
                "Failed to send order update email. Please try again."
        );
    }

    public void sendOrderOnRideEmail(String toEmail, String customerName, String orderNumber,
                                     List<String> itemSummaries, Double total) {
        String html = buildOrderStatusEmailHtml(
                customerName,
                orderNumber,
                itemSummaries,
                total,
                "Order on the way",
                "Your rider is on the way with ",
                "Your Buddy Feast order has left the kitchen and is now on the way to you. " +
                        "Please keep your phone nearby so the rider can reach you if needed."
        );

        sendEmail(
                toEmail,
                "Your Buddy Feast order is on the way",
                html,
                "Order on the way email",
                "Failed to send order update email. Please try again."
        );
    }

    public void sendOrderDeliveredEmail(String toEmail, String customerName, String orderNumber,
                                        List<String> itemSummaries, Double total) {
        String html = buildOrderStatusEmailHtml(
                customerName,
                orderNumber,
                itemSummaries,
                total,
                "Order delivered",
                "Delivered successfully: ",
                "Your order has been marked as delivered. We hope everything arrived fresh, hot, and exactly how you like it."
        );

        sendEmail(
                toEmail,
                "Your Buddy Feast order has been delivered",
                html,
                "Order delivered email",
                "Failed to send order update email. Please try again."
        );
    }

    private void sendEmail(String toEmail, String subject, String html, String logLabel, String failureMessage) {
        Map<String, Object> body = Map.of(
                "from", fromAddress,
                "to", List.of(toEmail),
                "subject", subject,
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
            log.info("{} sent to {} - Resend id: {}", logLabel, toEmail,
                    resBody != null ? resBody.get("id") : "unknown");
        } catch (Exception e) {
            log.error("Failed to send {} to {}: {}", logLabel, toEmail, e.getMessage());
            throw new RuntimeException(failureMessage);
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

    private String buildOrderStatusEmailHtml(String customerName, String orderNumber,
                                             List<String> itemSummaries, Double total,
                                             String headline, String statusLinePrefix, String message) {
        String safeName = HtmlUtils.htmlEscape(customerName != null && !customerName.isBlank()
                ? customerName.trim()
                : "there");
        String safeOrderNumber = HtmlUtils.htmlEscape(orderNumber != null && !orderNumber.isBlank()
                ? orderNumber
                : "your order");
        String itemsHtml = itemSummaries == null || itemSummaries.isEmpty()
                ? "<li style=\"margin:0 0 8px;color:#5f5a56\">Your selected items</li>"
                : itemSummaries.stream()
                    .map(item -> "<li style=\"margin:0 0 8px;color:#5f5a56\">" +
                            HtmlUtils.htmlEscape(item) + "</li>")
                    .collect(Collectors.joining(""));
        String formattedTotal = total != null
                ? "Rs " + String.format("%,.0f", total)
                : "Confirmed at checkout";
        String safeHeadline = HtmlUtils.htmlEscape(headline);
        String safeStatusLinePrefix = HtmlUtils.htmlEscape(statusLinePrefix);
        String safeMessage = HtmlUtils.htmlEscape(message);

        return "<!DOCTYPE html><html><body style=\"margin:0;padding:0;background:#faf9f7;font-family:Arial,sans-serif\">" +
               "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td align=\"center\" style=\"padding:40px 16px\">" +
               "<table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#ffffff;border-radius:20px;" +
               "overflow:hidden;box-shadow:0 8px 30px rgba(35,31,32,.1)\">" +

               "<tr><td style=\"background:#231f20;padding:32px 40px;text-align:center\">" +
               "<p style=\"margin:0;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#ffb627\">Buddy Feast</p>" +
               "<p style=\"margin:10px 0 0;font-size:24px;font-weight:900;color:#ffffff\">" + safeHeadline + "</p>" +
               "<p style=\"margin:8px 0 0;font-size:13px;color:#f6e9dc\">" + safeStatusLinePrefix + safeOrderNumber + ".</p>" +
               "</td></tr>" +

               "<tr><td style=\"padding:36px 40px\">" +
               "<p style=\"margin:0 0 16px;font-size:16px;line-height:1.6;color:#231f20\">Hi " + safeName + ",</p>" +
               "<p style=\"margin:0 0 22px;font-size:15px;line-height:1.7;color:#5f5a56\">" + safeMessage + "</p>" +

               "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#fff8ed;border:1px solid #f0dfc8;border-radius:14px;margin:0 0 24px\">" +
               "<tr><td style=\"padding:18px 20px\">" +
               "<p style=\"margin:0 0 10px;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#e8431f\">Order summary</p>" +
               "<p style=\"margin:0 0 12px;font-size:18px;font-weight:800;color:#231f20\">" + safeOrderNumber + "</p>" +
               "<ul style=\"margin:0 0 16px;padding-left:18px;font-size:14px;line-height:1.5\">" + itemsHtml + "</ul>" +
               "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-top:1px solid #f0dfc8;padding-top:12px\">" +
               "<tr><td style=\"font-size:13px;color:#7c746d\">Order total</td>" +
               "<td align=\"right\" style=\"font-size:16px;font-weight:800;color:#231f20\">" + formattedTotal + "</td></tr>" +
               "</table></td></tr></table>" +

               "<p style=\"margin:0;font-size:13px;line-height:1.6;color:#8a8178\">" +
               "Thank you for choosing Buddy Feast. If you need help with this order, please reply to this email or contact the restaurant team.</p>" +
               "</td></tr>" +

               "<tr><td style=\"padding:20px 40px;border-top:1px solid #f0efed;text-align:center\">" +
               "<p style=\"margin:0;font-size:12px;color:#bdbdbd\">&copy; 2024 Buddy Feast &middot; Multan, PK</p>" +
               "</td></tr>" +

               "</table></td></tr></table></body></html>";
    }
}
