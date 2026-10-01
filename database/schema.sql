drop database blood_bank; 
CREATE DATABASE blood_bank;
 
USE blood_bank;
 
-- =========================================
-- USERS  (collectors / admins log in; donors do not)
-- =========================================
 
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
 
    role ENUM('COLLECTOR', 'ADMIN')
        DEFAULT 'COLLECTOR',
 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
 
-- =========================================
-- BLOOD BANKS
-- (created before donors — donors references it)
-- =========================================
 
CREATE TABLE blood_banks (
    id INT PRIMARY KEY AUTO_INCREMENT,
 
    name VARCHAR(150) NOT NULL,
 
    address VARCHAR(255),
 
    city VARCHAR(100),
 
    phone VARCHAR(15),
 
    latitude DECIMAL(10,8),
 
    longitude DECIMAL(11,8),
 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
 
-- =========================================
-- DONORS
--
-- Matches the fields collected by the donor
-- registration form / routes/donors.js.
-- No login is required to register as a donor,
-- so there is no user_id foreign key here.
--
-- phone is UNIQUE so the same person can't end
-- up with duplicate donor rows.
-- =========================================
 
CREATE TABLE donors (
    id INT PRIMARY KEY AUTO_INCREMENT,
 
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
 
    blood_group ENUM(
        'A+', 'A-',
        'B+', 'B-',
        'O+', 'O-',
        'AB+', 'AB-'
    ) NOT NULL,
 
    phone VARCHAR(15) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
 
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
 
    -- Blood bank the donor intends to donate at
    blood_bank_id INT NULL,
 
    -- -------------------------------------
    -- Pre-screening answers ('Yes' / 'No')
    -- -------------------------------------
 
    infection VARCHAR(3),
    antibiotics VARCHAR(3),
    surgery VARCHAR(3),
    chronic_illness VARCHAR(3),
    feeling_well VARCHAR(3),
 
    -- -------------------------------------
    -- Result of the pre-screening. This is NOT
    -- final medical clearance.
    -- -------------------------------------
 
    eligibility_status ENUM(
        'PRELIMINARILY_ELIGIBLE',
        'NOT_ELIGIBLE'
    ) DEFAULT 'PRELIMINARILY_ELIGIBLE',
 
    available BOOLEAN DEFAULT FALSE,
 
    last_donation_date DATE NULL,
 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 
    FOREIGN KEY (blood_bank_id)
        REFERENCES blood_banks(id)
        ON DELETE SET NULL
);
 
-- =========================================
-- BLOOD COLLECTION REQUESTS
--
-- Matches routes/requests.js: donor requests
-- a collector to visit them; collector accepts
-- and later marks it completed.
-- =========================================
 
CREATE TABLE collection_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
 
    donor_id INT NOT NULL,
 
    collector_id INT NULL,
 
    blood_bank_id INT NULL,
 
    donor_latitude DECIMAL(10,8),
 
    donor_longitude DECIMAL(11,8),
 
    address VARCHAR(255),
 
    status ENUM(
        'PENDING',
        'ACCEPTED',
        'COMPLETED',
        'CANCELLED'
    ) DEFAULT 'PENDING',
 
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 
    accepted_at TIMESTAMP NULL,
 
    completed_at TIMESTAMP NULL,
 
    FOREIGN KEY (donor_id)
        REFERENCES donors(id)
        ON DELETE CASCADE,
 
    FOREIGN KEY (collector_id)
        REFERENCES users(id)
        ON DELETE SET NULL,
 
    FOREIGN KEY (blood_bank_id)
        REFERENCES blood_banks(id)
        ON DELETE SET NULL
);
 
-- =========================================
-- SAMPLE BLOOD BANKS
-- =========================================
 
INSERT INTO blood_banks
(name, address, city, phone, latitude, longitude)
VALUES
(
    'City Blood Bank',
    'Ameerpet',
    'Hyderabad',
    '9000000001',
    17.4375,
    78.4483
),
(
    'Government Blood Bank',
    'Koti',
    'Hyderabad',
    '9000000002',
    17.3850,
    78.4867
),
(
    'Red Cross Blood Bank',
    'Lakdikapul',
    'Hyderabad',
    '9000000003',
    17.4000,
    78.4650
),
(
    'Apollo Blood Bank',
    'Jubilee Hills',
    'Hyderabad',
    '9000000004',
    17.4310,
    78.4070
);
SET SQL_SAFE_UPDATES = 0;
 
DELETE d1 FROM donors d1
INNER JOIN donors d2
    ON d1.phone = d2.phone
    AND d1.id > d2.id;
 
-- Turn safe mode back on afterward (good practice):
SET SQL_SAFE_UPDATES = 1;
 
-- Check the result:
SELECT phone, COUNT(*) AS total
FROM donors
GROUP BY phone
HAVING COUNT(*) > 1;
ALTER TABLE donors
DROP COLUMN latitude,
DROP COLUMN longitude;

ALTER TABLE donors
ADD COLUMN address VARCHAR(255) AFTER city;

ALTER TABLE collection_requests
DROP COLUMN donor_latitude,
DROP COLUMN donor_longitude;

DESCRIBE donors;
DESCRIBE collection_requests;