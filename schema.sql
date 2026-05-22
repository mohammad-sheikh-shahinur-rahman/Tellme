-- TellMe MySQL Schema

CREATE DATABASE IF NOT EXISTS tellme_db;
USE tellme_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY, -- Firebase UID or local UUID
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    bio TEXT,
    avatarUrl TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Letters Table
CREATE TABLE IF NOT EXISTS letters (
    id VARCHAR(255) PRIMARY KEY,
    toUserId VARCHAR(255) NOT NULL,
    toUsername VARCHAR(50) NOT NULL,
    fromUserId VARCHAR(255), -- Optional for logged-in senders
    fromUsername VARCHAR(50),
    encryptedContent TEXT NOT NULL,
    templateId VARCHAR(50),
    fontSize VARCHAR(20),
    attachmentBase64 LONGTEXT, -- Using LONGTEXT for base64 images
    voiceBase64 LONGTEXT,
    isRead BOOLEAN DEFAULT FALSE,
    replyEncryptedContent TEXT,
    repliedAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (toUserId) REFERENCES users(id) ON DELETE CASCADE
);
