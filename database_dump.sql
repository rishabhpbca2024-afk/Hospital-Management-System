-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: hospital_management_system
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `Admin_id` int NOT NULL,
  `Name` varchar(20) DEFAULT NULL,
  `Username` varchar(30) DEFAULT NULL,
  `Password` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`Admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1011,'Rishabh Pal','Rishabh@123','Rishabh123');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointment`
--

DROP TABLE IF EXISTS `appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment` (
  `appointment_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `doctor_id` int DEFAULT NULL,
  `appointment_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending..',
  `diagnosis` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`appointment_id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `appointment_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`),
  CONSTRAINT `appointment_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment`
--

LOCK TABLES `appointment` WRITE;
/*!40000 ALTER TABLE `appointment` DISABLE KEYS */;
INSERT INTO `appointment` VALUES (1,1,201,'2025-11-12','Completed','High blood pressure'),(2,2,202,'2025-12-12','Completed','Migraine'),(3,3,202,'2025-01-12','Completed','Parkinsons disease'),(4,4,205,'2025-12-30','Referred','Cataract'),(5,2,204,'2025-02-02','Completed','Heart Attack'),(6,7,205,'2025-12-15','Completed','Eye Pain'),(7,8,203,'2026-01-01','Completed','Fracture'),(8,7,201,'2025-12-20','Accepted','Heart Pain'),(9,11,202,'2002-07-06','Completed','Heart Attack'),(10,10,203,'2025-12-25','Completed','Fracture'),(11,10,202,'2025-12-12','Completed','Migraine'),(12,12,202,'2025-12-25','Pending..','Fever'),(13,13,201,'2025-12-25','Pending..','Eye Pain'),(14,14,207,'2025-12-26','Completed','Brain tumor'),(15,15,203,'2025-11-17','Completed','Lag Fracture');
/*!40000 ALTER TABLE `appointment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bill`
--

DROP TABLE IF EXISTS `bill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bill` (
  `bill_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `doctor_id` int DEFAULT NULL,
  `prescribed_id` int DEFAULT NULL,
  `total_medicine_cost` decimal(10,2) DEFAULT NULL,
  `doctor_fee` decimal(10,2) DEFAULT NULL,
  `total_amount` decimal(10,2) GENERATED ALWAYS AS ((`total_medicine_cost` + `doctor_fee`)) STORED,
  `bill_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_status` enum('Pending','Paid','Cancelled') DEFAULT 'Pending',
  `payment_mode` varchar(50) DEFAULT 'Not Selected',
  PRIMARY KEY (`bill_id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `fk_prescribed_id` (`prescribed_id`),
  CONSTRAINT `bill_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`),
  CONSTRAINT `bill_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`),
  CONSTRAINT `fk_prescribed_id` FOREIGN KEY (`prescribed_id`) REFERENCES `prescribed_medicine` (`prescribed_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill`
--

LOCK TABLES `bill` WRITE;
/*!40000 ALTER TABLE `bill` DISABLE KEYS */;
INSERT INTO `bill` (`bill_id`, `patient_id`, `doctor_id`, `prescribed_id`, `total_medicine_cost`, `doctor_fee`, `bill_date`, `payment_status`, `payment_mode`) VALUES (1,1,201,2,56.00,1500.00,'2025-11-11 08:04:57','Paid','Cash'),(2,8,203,1,50.00,850.00,'2025-11-11 08:06:21','Paid','Card'),(7,3,202,4,300.00,700.00,'2025-11-11 08:50:01','Paid','Cash'),(8,2,202,3,25.00,700.00,'2025-11-12 07:22:01','Paid','Cash'),(9,7,205,6,12.00,2000.00,'2025-11-12 07:35:57','Paid','UPI'),(10,11,202,7,25.00,700.00,'2025-11-13 06:08:49','Paid','UPI'),(11,15,203,11,12500.00,850.00,'2025-11-17 07:01:26','Paid','Cash'),(12,15,203,11,12500.00,850.00,'2025-11-17 08:58:38','Paid','UPI');
/*!40000 ALTER TABLE `bill` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dispensed_medicine`
--

DROP TABLE IF EXISTS `dispensed_medicine`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dispensed_medicine` (
  `dispense_id` int NOT NULL AUTO_INCREMENT,
  `prescribed_id` int DEFAULT NULL,
  `patient_id` int DEFAULT NULL,
  `medicine_id` int DEFAULT NULL,
  `medicine_name` varchar(100) DEFAULT NULL,
  `dosage` varchar(50) DEFAULT NULL,
  `duration` varchar(50) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `instructions` varchar(255) DEFAULT NULL,
  `dispense_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`dispense_id`),
  KEY `medicine_id` (`medicine_id`),
  KEY `patient_id` (`patient_id`),
  KEY `fk_dispensed_prescribed` (`prescribed_id`),
  CONSTRAINT `dispensed_medicine_ibfk_3` FOREIGN KEY (`medicine_id`) REFERENCES `medicine` (`medicine_id`),
  CONSTRAINT `fk_dispensed_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`),
  CONSTRAINT `fk_dispensed_prescribed` FOREIGN KEY (`prescribed_id`) REFERENCES `prescribed_medicine` (`prescribed_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dispensed_medicine`
--

LOCK TABLES `dispensed_medicine` WRITE;
/*!40000 ALTER TABLE `dispensed_medicine` DISABLE KEYS */;
INSERT INTO `dispensed_medicine` VALUES (1,1,8,1,'Paracetamol','2','10',20,'After Meal','2025-11-11 04:39:56'),(2,2,1,2,'Diclofenac','2','7',14,'After Meal','2025-11-11 06:06:35'),(7,3,2,1,'Paracetamol','1','10',10,'After Meal','2025-11-11 08:46:07'),(8,4,3,4,'Azithromycin','2','15',30,'After Meal','2025-11-11 08:50:01'),(9,5,2,2,'Diclofenac','1','10',10,'Before BreakFast','2025-11-12 07:22:01'),(10,6,7,7,'Hydrocortisone','1','10',1,'2 Drops in 1 day','2025-11-12 07:35:57'),(11,7,11,1,'paracetamol','3','5',15,'after meal','2025-11-13 06:08:49'),(12,11,15,1,'Paracetamol','100','50',100,'after meal in day and night','2025-11-17 07:01:26'),(13,11,15,1,'Paracetamol','100','50',5000,'after meal in day and night','2025-11-17 08:58:38');
/*!40000 ALTER TABLE `dispensed_medicine` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor`
--

DROP TABLE IF EXISTS `doctor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor` (
  `doctor_id` int NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `contact_no` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `fees` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor`
--

LOCK TABLES `doctor` WRITE;
/*!40000 ALTER TABLE `doctor` DISABLE KEYS */;
INSERT INTO `doctor` VALUES (11,'Dr. Mohan Meena','Kidney Spacelist','6789054321','mohan@gmail.com','mohan123',500.00),(201,'Dr. Rajesh Sharma','Cardiologist','8798655412','Rajesh@gmail.com','Rajesh123',1500.00),(202,'Dr. Neha Verma','Neurologist','8877996655','Neha@gmail.com','Neha123',700.00),(203,'Dr. Amit Patel','Orthopedic Surgeon','7788996655','Amit@gmail.com','Amit123',850.00),(204,'Dr. Priya Mehta','Dermatologist','8798654512','Priya@gmail.com','Priya123',500.00),(205,'Angraaj Karan','Ophthalmologist','8889997778','Angraaj@gmail.com','Angraaj123',2000.00),(206,'Anees Khan','ENT Specialist','6265598762','Anees@acn.in','Anees123',1500.00),(207,'Aryan Sahu','Neurologist','8798456544','Aryan@gmail.com','Aryan123',1500.00);
/*!40000 ALTER TABLE `doctor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicine`
--

DROP TABLE IF EXISTS `medicine`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicine` (
  `medicine_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('Tablet','Capsule','Syrup','Injection','Ointment','Drops') NOT NULL,
  `price_per_unit` decimal(10,2) DEFAULT NULL,
  `stock_quantity` int DEFAULT '0',
  `expiry_date` date DEFAULT NULL,
  `reorder_level` int DEFAULT '10',
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`medicine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicine`
--

LOCK TABLES `medicine` WRITE;
/*!40000 ALTER TABLE `medicine` DISABLE KEYS */;
INSERT INTO `medicine` VALUES (1,'Paracetamol','Tablet',2.50,51,'2026-12-31',10,'Pain & fever relief'),(2,'Diclofenac','Tablet',4.00,86,'2026-07-31',10,'Pain & inflammation'),(3,'Amoxicillin','Capsule',5.00,50,'2026-11-30',10,'Antibiotic'),(4,'Azithromycin','Tablet',10.00,60,'2026-12-31',10,'Antibiotic'),(5,'Cetirizine','Tablet',3.00,80,'2026-05-15',10,'Allergy relief'),(6,'Omeprazole','Capsule',6.00,48,'2026-09-30',10,'Acid reflux'),(7,'Hydrocortisone','Ointment',12.00,100,'2026-04-30',10,'Skin inflammation'),(8,'Loratadine','Tablet',3.50,100,'2026-08-31',10,'Allergy relief'),(9,'Salbutamol','Syrup',8.00,30,'2026-11-15',10,'Asthma relief'),(10,'Metformin','Tablet',7.00,90,'2026-03-31',10,'Diabetes management');
/*!40000 ALTER TABLE `medicine` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient`
--

DROP TABLE IF EXISTS `patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient` (
  `patient_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `contact_no` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`patient_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient`
--

LOCK TABLES `patient` WRITE;
/*!40000 ALTER TABLE `patient` DISABLE KEYS */;
INSERT INTO `patient` VALUES (1,'Mohan Meena','Male','2006-02-22','8798654512','Mohan@gmail.com','Bhopal','Mohan123'),(2,'Aman Bakore ','Male','2006-06-20','7898654512','Aman@gmail.com','Indore','Aman123'),(3,'Anushka','Female','2006-08-14','9886663118','anushka@gmail.com','Harda','anuu14'),(4,'Karan Joshi','Male','2002-02-22','8798654512','Karan@gmail.com','Mumbai','Karan123'),(5,'Kartik Yadav','Male','2009-10-11','8798654512','Kartik@gmail.com','Mumbai','Kartik123'),(7,'Rohit Sharma','Male','1990-05-02','8798565412','Rohit@gmail.com','Mumbai','Rohit123'),(8,'Priya Jaat','Female','2006-03-26','8798456545','Priya@gmail.com','Pune','Priya123'),(9,'Rampal Patel','Male','2000-02-12','8798456545','Rampal@gmail.com','Indore','Rampal123'),(10,'Rishabh Pal','Male','2006-03-22','9898874565','Rishabh@gmail.com','Kannod','Rishabh123'),(11,'Dhruv','Male','2025-11-13','6265598762','anees@ssism.org','Harda','Dhruv123'),(12,'Tanu Yadav','Female','2007-05-18','8785965465','Tanu@gmail.com','Mumbai','Tanu@123'),(13,'Anmol Dholan','Male','2008-02-11','8798564574','Anmol@gmail..com','Kannod','Anmol123'),(14,'Harshit Pal','Male','2006-11-22','8798456545','Harshit@gmail.com','Seoni','Harshit123'),(15,'2','Male','2025-11-16','6543217890','2@gmail.com','2222','2222');
/*!40000 ALTER TABLE `patient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pharmacist`
--

DROP TABLE IF EXISTS `pharmacist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pharmacist` (
  `Pharmacist_id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) DEFAULT NULL,
  `Contact_no` varchar(20) DEFAULT NULL,
  `Password` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`Pharmacist_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pharmacist`
--

LOCK TABLES `pharmacist` WRITE;
/*!40000 ALTER TABLE `pharmacist` DISABLE KEYS */;
INSERT INTO `pharmacist` VALUES (7,'Mohan Meena','8798456545','Mohan123'),(8,'Rishabh Pal','6543217890','Rishabh@123');
/*!40000 ALTER TABLE `pharmacist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescribed_medicine`
--

DROP TABLE IF EXISTS `prescribed_medicine`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescribed_medicine` (
  `prescribed_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `doctor_id` int DEFAULT NULL,
  `medicine_id` int DEFAULT NULL,
  `medicine_name` varchar(100) DEFAULT NULL,
  `dosage` varchar(50) DEFAULT NULL,
  `duration` varchar(50) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `instructions` varchar(255) DEFAULT NULL,
  `Status` varchar(20) DEFAULT 'Pending',
  PRIMARY KEY (`prescribed_id`),
  KEY `patient_id` (`patient_id`),
  KEY `medicine_id` (`medicine_id`),
  KEY `fk_prescribed_doctor` (`doctor_id`),
  CONSTRAINT `fk_prescribed_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`),
  CONSTRAINT `prescribed_medicine_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`),
  CONSTRAINT `prescribed_medicine_ibfk_2` FOREIGN KEY (`medicine_id`) REFERENCES `medicine` (`medicine_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescribed_medicine`
--

LOCK TABLES `prescribed_medicine` WRITE;
/*!40000 ALTER TABLE `prescribed_medicine` DISABLE KEYS */;
INSERT INTO `prescribed_medicine` VALUES (1,8,203,1,'Paracetamol','2','10',20,'After Meal','Dispensed'),(2,1,201,2,'Diclofenac','2','7',14,'After Meal','Dispensed'),(3,2,202,1,'Paracetamol','1','10',10,'After Meal','Dispensed'),(4,3,202,4,'Azithromycin','2','15',30,'After meal ','Dispensed'),(5,2,204,2,'Diclofenac','1','10',10,'Before BreakFast','Dispensed'),(6,7,205,7,'Hydrocortisone','1','10',1,'2 Drops in 1 day','Dispensed'),(7,11,202,1,'paracetamol','3','5',10,'before meal','Dispensed'),(8,10,202,1,'Paracetamol','2','10',20,'After Meal','Pending'),(9,10,203,9,' Salbutamol','2','10',20,'After Meal','Pending'),(10,14,207,7,'Hydrocortisone','2','10',20,'After Meal','Pending'),(11,15,203,1,'Paracetamol','100','50',5000,'after meal in day and night','Dispensed'),(12,15,203,2,'Diclofenac','2','60',120,'after meal in day and night','Pending'),(13,15,203,5,'Cetirizine','1','40',40,'after meal in day and night','Pending');
/*!40000 ALTER TABLE `prescribed_medicine` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescription`
--

DROP TABLE IF EXISTS `prescription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescription` (
  `prescription_id` int NOT NULL AUTO_INCREMENT,
  `appointment_id` int DEFAULT NULL,
  `doctor_id` int DEFAULT NULL,
  `patient_id` int DEFAULT NULL,
  `diagnosis` varchar(255) DEFAULT NULL,
  `prescription_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Pending',
  PRIMARY KEY (`prescription_id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `prescription_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`appointment_id`),
  CONSTRAINT `prescription_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`),
  CONSTRAINT `prescription_ibfk_3` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription`
--

LOCK TABLES `prescription` WRITE;
/*!40000 ALTER TABLE `prescription` DISABLE KEYS */;
INSERT INTO `prescription` VALUES (1,7,203,8,' Fracture','2025-11-11 04:36:59','Take Test','Given'),(2,1,201,1,' High blood pressure','2025-11-11 05:37:36','Reduce Salt','Given'),(3,2,202,2,'Migraine','2025-11-11 05:49:31','wear glasses','Given'),(4,3,202,3,'Parkinsons disease','2025-11-11 05:54:19','Stress control','Given'),(5,5,204,2,'Heart Attack','2025-11-12 06:53:10','Reduce salt','Given'),(7,6,205,7,' Eye Pain','2025-11-12 07:27:13','Use Drops Daily','Given'),(8,9,202,11,'Heart Attack','2025-11-13 05:59:58','lkjhgfdsa','Given'),(9,11,202,10,' Migraine','2025-11-13 16:11:48','Take Rest','Given'),(10,10,203,10,'Fracture','2025-11-14 01:10:24','Take Rest','Given'),(12,14,207,14,'Brain tumor','2025-11-16 13:31:31','Stress Control','Given'),(13,15,203,15,'Lag Fracture','2025-11-17 06:05:52','6 Month Bad rest','Given');
/*!40000 ALTER TABLE `prescription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refer_patient`
--

DROP TABLE IF EXISTS `refer_patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refer_patient` (
  `refer_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `from_doctor_id` int DEFAULT NULL,
  `to_doctor_id` int DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `refer_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`refer_id`),
  KEY `patient_id` (`patient_id`),
  KEY `from_doctor_id` (`from_doctor_id`),
  CONSTRAINT `refer_patient_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`),
  CONSTRAINT `refer_patient_ibfk_2` FOREIGN KEY (`from_doctor_id`) REFERENCES `doctor` (`doctor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refer_patient`
--

LOCK TABLES `refer_patient` WRITE;
/*!40000 ALTER TABLE `refer_patient` DISABLE KEYS */;
INSERT INTO `refer_patient` VALUES (1,4,205,204,'Not my department','2025-11-12 06:59:48');
/*!40000 ALTER TABLE `refer_patient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reorder_request`
--

DROP TABLE IF EXISTS `reorder_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reorder_request` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `medicine_id` int DEFAULT NULL,
  `medicine_name` varchar(100) DEFAULT NULL,
  `current_stock` int DEFAULT NULL,
  `reorder_level` int DEFAULT NULL,
  `requested_quantity` int DEFAULT NULL,
  `request_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Pending','Approved','Rejected','Received') DEFAULT 'Pending',
  PRIMARY KEY (`request_id`),
  KEY `medicine_id` (`medicine_id`),
  CONSTRAINT `reorder_request_ibfk_1` FOREIGN KEY (`medicine_id`) REFERENCES `medicine` (`medicine_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reorder_request`
--

LOCK TABLES `reorder_request` WRITE;
/*!40000 ALTER TABLE `reorder_request` DISABLE KEYS */;
INSERT INTO `reorder_request` VALUES (1,1,'Paracetamol',9,10,50,'2025-11-10 05:04:11','Approved'),(2,1,'Paracetamol',9,10,50,'2025-11-11 04:41:10','Approved'),(3,1,'Paracetamol',9,10,100,'2025-11-11 08:46:27','Approved'),(4,4,'Azithromycin',10,10,50,'2025-11-11 08:50:19','Approved'),(5,7,'Hydrocortisone',24,10,76,'2025-11-13 06:11:01','Rejected'),(6,1,'Paracetamol',94,10,6,'2025-11-14 07:07:38','Approved'),(7,1,'Paracetamol',100,10,5001,'2025-11-17 06:13:51','Approved'),(8,2,'Diclofenac',36,10,50,'2025-11-17 06:24:23','Approved');
/*!40000 ALTER TABLE `reorder_request` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-23 13:22:30
