package com.careerpilot.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling   // required by the OutboxPublisher poller
public class UserServiceApplication {
    public static void main(String[] args) {
        // Postgres rejects the legacy 'Asia/Calcutta' zone id that this JVM
        // reports by default. Pinning the modern id here makes the service
        // start correctly regardless of how it is launched (no -D flag needed).
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
