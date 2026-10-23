package com.ai.Resume.analyser.mail;


import brevo.ApiClient;
import brevo.ApiException;
import brevo.Configuration;
import brevoApi.TransactionalEmailsApi;
import brevoModel.SendSmtpEmail;
import brevoModel.SendSmtpEmailSender;
import brevoModel.SendSmtpEmailTo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import java.util.Collections;

@Service
public class mailService {

   @Value("${apiKey}")
   private String apiKey;
    @Autowired
    private TemplateEngine templateEngine;

    public void sentVerifyOtp(String username,String email,String otp)  {
        System.out.println("===============================================================");
        System.out.println(">>> [OTP VERIFICATION] User: " + username + " | Email: " + email + " | OTP: " + otp);
        System.out.println("===============================================================");

        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("dummy")) {
            return;
        }

        try {
            String toEmail=email.charAt(0)+"*********"+email.substring(email.indexOf("@"));
            Context context = new Context();
            context.setVariable("username",username);
            context.setVariable("email",toEmail);
            context.setVariable("otp",otp);

            String mgs = templateEngine.process("verify-otp",context);

            ApiClient apiClient = Configuration.getDefaultApiClient();
            apiClient.setApiKey(apiKey);

            TransactionalEmailsApi transactionalEmailsApi = new TransactionalEmailsApi(apiClient);

            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            sendSmtpEmail.setSender(new SendSmtpEmailSender().name("Resume Analyser").email("support@resumeanalyser.com"));
            sendSmtpEmail.setTo(Collections.singletonList(new SendSmtpEmailTo().name(username).email(email)));
            sendSmtpEmail.setSubject("Email verification OTP");
            sendSmtpEmail.setHtmlContent(mgs);

            transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
        } catch (Exception e) {
            System.err.println("Brevo mail sending failed (use console OTP for dev): " + e.getMessage());
        }
    }

    public void sentResetOtp(String username,String email,String otp)  {
        System.out.println("===============================================================");
        System.out.println(">>> [RESET OTP] User: " + username + " | Email: " + email + " | OTP: " + otp);
        System.out.println("===============================================================");

        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("dummy")) {
            return;
        }

        try {
            String toEmail=email.charAt(0)+"*********"+email.substring(email.indexOf("@"));
            Context context = new Context();
            context.setVariable("username",username);
            context.setVariable("email",toEmail);
            context.setVariable("otp",otp);

            String mgs = templateEngine.process("reset-otp",context);

            ApiClient apiClient = Configuration.getDefaultApiClient();
            apiClient.setApiKey(apiKey);

            TransactionalEmailsApi transactionalEmailsApi = new TransactionalEmailsApi(apiClient);

            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            sendSmtpEmail.setSender(new SendSmtpEmailSender().name("Resume Analyser").email("support@resumeanalyser.com"));
            sendSmtpEmail.setTo(Collections.singletonList(new SendSmtpEmailTo().name(username).email(email)));
            sendSmtpEmail.setSubject("Reset password OTP");
            sendSmtpEmail.setHtmlContent(mgs);

            transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
        } catch (Exception e) {
            System.err.println("Brevo mail sending failed (use console OTP for dev): " + e.getMessage());
        }
    }


}
