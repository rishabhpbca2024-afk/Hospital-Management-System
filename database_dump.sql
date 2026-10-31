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
  `Password` varchar(255) DEFAULT NULL,
  `must_change_password` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`Admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1011,'Rishabh Pal','Rishabh@123','$2b$10$kfqRjrmb20EqecQXkjmF2ePtXdzK4isJLYtqBKKOW6QpZ645NYWT.',0);
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
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment`
--

LOCK TABLES `appointment` WRITE;
/*!40000 ALTER TABLE `appointment` DISABLE KEYS */;
INSERT INTO `appointment` VALUES (1,1,201,'2025-11-12','Completed','High blood pressure'),(2,2,11,'2025-12-12','Completed','Migraine'),(3,3,202,'2025-01-12','Completed','Parkinsons disease'),(4,4,205,'2025-12-30','Referred','Cataract'),(5,2,204,'2025-02-02','Completed','Heart Attack'),(6,7,205,'2025-12-15','Completed','Eye Pain'),(7,8,203,'2026-01-01','Completed','Fracture'),(8,7,201,'2025-12-20','Accepted','Heart Pain'),(9,11,202,'2002-07-06','Completed','Heart Attack'),(10,10,203,'2025-12-25','Completed','Fracture'),(11,10,202,'2025-12-12','Completed','Migraine'),(12,12,11,'2025-12-25','Pending..','Fever'),(13,13,11,'2025-12-25','Accepted','Eye Pain'),(14,14,207,'2025-12-26','Completed','Brain tumor'),(15,15,203,'2025-11-17','Completed','Right Femur Fracture'),(16,1,201,'2026-10-08','Completed','Pain'),(17,18,11,'2026-11-03','Accepted','Recurrent kidney stone and flank pain'),(18,4,201,'2026-10-25','Pending..','Routine checkup and consultation'),(19,2,201,'2026-11-04','Pending..','Chest discomfort and shortness of breath on exertion'),(20,20,201,'2026-11-02','Accepted','Post-angioplasty annual follow-up and ECG review'),(21,21,201,'2026-10-25','Completed','Hypertensive urgency with vertigo'),(22,1,202,'2026-11-06','Accepted','Chronic tension headache and vertigo'),(23,22,202,'2026-11-01','Pending..','Peripheral neuropathy in lower extremities'),(24,23,202,'2026-10-22','Completed','Epilepsy medication dosage adjustment'),(25,5,208,'2026-11-02','Accepted','Pediatric seasonal viral fever and acute dry cough'),(26,24,209,'2026-11-04','Pending..','General malaise, acute fatigue and vitamin deficiency'),(27,3,210,'2026-10-30','Completed','Routine wellness checkup and pelvic ultrasound examination');
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
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill`
--

LOCK TABLES `bill` WRITE;
/*!40000 ALTER TABLE `bill` DISABLE KEYS */;
INSERT INTO `bill` (`bill_id`, `patient_id`, `doctor_id`, `prescribed_id`, `total_medicine_cost`, `doctor_fee`, `bill_date`, `payment_status`, `payment_mode`) VALUES (1,1,201,2,56.00,1500.00,'2025-11-11 08:04:57','Paid','Cash'),(2,8,203,1,50.00,850.00,'2025-11-11 08:06:21','Paid','Card'),(7,3,202,4,300.00,700.00,'2025-11-11 08:50:01','Paid','Cash'),(8,2,202,3,25.00,700.00,'2025-11-12 07:22:01','Paid','Cash'),(9,7,205,6,12.00,2000.00,'2025-11-12 07:35:57','Paid','UPI'),(10,11,202,7,25.00,700.00,'2025-11-13 06:08:49','Paid','UPI'),(11,15,203,11,12500.00,850.00,'2025-11-17 07:01:26','Paid','Cash'),(12,15,203,11,12500.00,850.00,'2025-11-17 08:58:38','Paid','UPI'),(13,1,201,14,120.00,1500.00,'2026-10-08 08:34:03','Paid','UPI'),(14,15,203,13,120.00,850.00,'2026-10-08 13:07:47','Pending','Not Selected'),(16,10,203,9,160.00,850.00,'2026-10-12 06:57:37','Pending','Not Selected'),(17,1,11,14,255.00,500.00,'2026-10-29 06:30:00','Pending','Not Selected'),(18,2,201,15,435.00,1500.00,'2026-10-30 08:45:00','Pending','Not Selected'),(19,18,11,22,135.00,500.00,'2026-10-28 11:00:00','Paid','UPI'),(20,21,201,16,150.00,1500.00,'2026-10-26 05:50:00','Paid','Card'),(21,23,202,18,660.00,700.00,'2026-10-23 10:15:00','Paid','Cash'),(22,5,208,19,68.00,800.00,'2026-10-29 05:30:00','Paid','UPI'),(23,3,210,20,420.00,900.00,'2026-10-30 11:30:00','Paid','Card');
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
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dispensed_medicine`
--

LOCK TABLES `dispensed_medicine` WRITE;
/*!40000 ALTER TABLE `dispensed_medicine` DISABLE KEYS */;
INSERT INTO `dispensed_medicine` VALUES (1,1,8,1,'Paracetamol','2','10',20,'After Meal','2025-11-11 04:39:56'),(2,2,1,2,'Diclofenac','2','7',14,'After Meal','2025-11-11 06:06:35'),(7,3,2,1,'Paracetamol','1','10',10,'After Meal','2025-11-11 08:46:07'),(8,4,3,4,'Azithromycin','2','15',30,'After Meal','2025-11-11 08:50:01'),(9,5,2,2,'Diclofenac','1','10',10,'Before BreakFast','2025-11-12 07:22:01'),(10,6,7,7,'Hydrocortisone','1','10',1,'2 Drops in 1 day','2025-11-12 07:35:57'),(11,7,11,1,'paracetamol','3','5',15,'after meal','2025-11-13 06:08:49'),(12,11,15,1,'Paracetamol','100','50',100,'after meal in day and night','2025-11-17 07:01:26'),(13,11,15,1,'Paracetamol','100','50',5000,'after meal in day and night','2025-11-17 08:58:38'),(14,14,1,7,'Hydrocortisone','2','5',10,'After meals','2026-10-08 08:34:03'),(15,13,15,5,'Cetirizine','1','40',40,'after meal in day and night','2026-10-08 13:07:47'),(26,9,10,9,' Salbutamol','2','10',20,'After Meal','2026-10-12 06:57:37');
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
  `must_change_password` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor`
--

LOCK TABLES `doctor` WRITE;
/*!40000 ALTER TABLE `doctor` DISABLE KEYS */;
INSERT INTO `doctor` VALUES (11,'Dr. Mohan Meena','Nephrologist','6789054321','mohan@gmail.com','$2a$10$lx4mcw4NHyVGc26.JVGXquy7UBxQg20ReS15ChwiZeJcIWpKTBkTi',500.00,0),(201,'Dr. Rajesh Sharma','Cardiologist','8798655412','Rajesh@gmail.com','$2a$10$lx4mcw4NHyVGc26.JVGXqupYAR5ua.jceT7hRshUCCL1aah4VSZ4C',1500.00,0),(202,'Dr. Neha Verma','Neurologist','8877996655','Neha@gmail.com','$2a$10$lx4mcw4NHyVGc26.JVGXquvr/KKycYV8Qkpu7kp22reqGU/7ZQQVe',700.00,0),(203,'Dr. Amit Patel','Orthopedic Surgeon','7788996655','Amit@gmail.com','$2a$10$lx4mcw4NHyVGc26.JVGXqu3eX0e4X1zZPpD4WGjujaEKIsRHSiEkS',850.00,0),(204,'Dr. Priya Mehta','Dermatologist','8798654512','Priya@gmail.com','$2a$10$lx4mcw4NHyVGc26.JVGXquedt4n2aQBkf6KTo.VfjJRg2vtsrTGHK',500.00,0),(205,'Dr. Angad Karan','Ophthalmologist','8889997778','Angraaj@gmail.com','$2a$10$lx4mcw4NHyVGc26.JVGXquKj4BvcMdJ.9QtXbJm6nDi4rByrsZAQK',2000.00,0),(206,'Dr. Anees Khan','ENT Specialist','6265598762','Anees@acn.in','$2a$10$lx4mcw4NHyVGc26.JVGXquQpffku8BFlbP6OJVr.rQ6rCLhjBqYXa',1500.00,0),(207,'Dr. Aryan Sahu','Neurologist','8798456544','Aryan@gmail.com','$2a$10$lx4mcw4NHyVGc26.JVGXquM6MYylu6ziX6lrRxz992RvO9B.jamn6',1500.00,0),(208,'Dr. Sunita Kapoor','Pediatrician','9826011223','sunita@gmail.com','$2a$10$Jn9jvJqrd7F1yPAokmqbdOBzfi0IegNmJlvbUTnyyV37Ua4rcEmfW',800.00,0),(209,'Dr. Vikram Malhotra','General Physician','9826022334','vikram@gmail.com','$2a$10$Jn9jvJqrd7F1yPAokmqbdOwlg7umv6plvbgbs8d8x9D3BDv1ZBBtu',600.00,0),(210,'Dr. Ananya Roy','Gynecologist','9826033445','ananya@gmail.com','$2a$10$Jn9jvJqrd7F1yPAokmqbdOlTUAHkS6vEI2MGiqjA4q9LFo5OhlOxy',900.00,0),(211,'Dr. Sanjay Gupta','Pulmonologist','9826044556','sanjay@gmail.com','$2a$10$Jn9jvJqrd7F1yPAokmqbdO7lZpJ/63Lo3.jQJZFMOEXKQLUNbAquu',1100.00,0),(212,'Dr. Shalini Deshmukh','Psychiatrist','9826055667','shalini@gmail.com','$2a$10$Jn9jvJqrd7F1yPAokmqbdO4px5.gSg./.c0UtHUQ/CEi0dTdOBoNO',1200.00,0);
/*!40000 ALTER TABLE `doctor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `feedback_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `user_name` varchar(100) NOT NULL,
  `user_role` varchar(50) NOT NULL,
  `rating` int NOT NULL DEFAULT '5',
  `category` varchar(50) DEFAULT 'General',
  `message` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`feedback_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
INSERT INTO `feedback` VALUES (1,NULL,'Rahul Verma','patient',5,'Doctor Care','Great consultation with Dr. Mohan! Very professional.','2026-10-08 13:58:30'),(2,NULL,'Anonymous User','patient',5,'Doctor Consultation','Express backend working cleanly!','2026-10-08 14:24:29'),(3,1,'Mohan Meena','patient',5,'Doctor Consultation','Dr. Rajesh Sharma was very patient and explained the cardiac diagnosis clearly. The automated prescription workflow is seamless.','2026-10-28 08:50:00'),(4,2,'Aman Bakore','patient',5,'Pharmacy Service','Medicines were dispensed in less than two minutes at the pharmacy counter. Excellent digital billing experience.','2026-10-27 10:40:00'),(5,203,'Dr. Amit Patel','doctor',5,'Staff & Operations','The inter-departmental referral system between Orthopedics and Neurology works flawlessly for patient care.','2026-10-26 06:35:00'),(6,19,'Meera Nair','patient',4,'Cleanliness & Facilities','The hospital environment is hygienic and well organized. Digital queue management saved us lots of waiting time.','2026-10-25 12:10:00'),(7,7,'Mohan Meena','pharmacist',5,'Pharmacy Module','Automated low stock alerts and direct procurement request submission have significantly reduced stockout incidents.','2026-10-24 05:45:00'),(8,20,'Arjun Kapoor','patient',5,'Doctor Consultation','Consulted Dr. Sunita Kapoor for my younger brother. Very compassionate care and accurate diagnosis.','2026-10-23 05:00:00'),(9,21,'Sanya Mirza','patient',5,'Billing & Transparency','Itemized billing with instant UPI payment and digital receipt download makes the entire discharge smooth.','2026-10-22 08:20:00'),(10,201,'Dr. Rajesh Sharma','doctor',5,'Clinical System','Digital patient history access before every consultation gives doctors complete context of past medications.','2026-10-21 12:30:00');
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
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
INSERT INTO `medicine` VALUES (1,'Paracetamol','Tablet',2.50,56,'2026-12-31',10,'Pain & fever relief'),(2,'Diclofenac','Tablet',4.00,86,'2026-07-31',10,'Pain & inflammation'),(3,'Amoxicillin','Capsule',5.00,50,'2026-11-30',10,'Antibiotic'),(4,'Azithromycin','Tablet',10.00,60,'2026-12-31',10,'Antibiotic'),(5,'Cetirizine','Tablet',3.00,50,'2028-10-15',10,'Allergy relief'),(6,'Omeprazole','Capsule',6.00,25,'2028-10-12',10,'Acid reflux'),(7,'Hydrocortisone','Ointment',12.00,90,'2026-04-30',10,'Skin inflammation'),(8,'Loratadine','Tablet',3.50,100,'2026-08-31',10,'Allergy relief'),(9,'Salbutamol','Syrup',8.00,53,'2026-11-15',10,'Asthma relief'),(10,'Metformin','Tablet',7.00,90,'2026-03-31',10,'Diabetes management'),(11,'Atorvastatin 20mg','Tablet',14.50,120,'2028-06-30',15,'Cholesterol & cardiovascular risk reduction'),(12,'Amlodipine 5mg','Tablet',5.00,85,'2027-11-30',15,'Calcium channel blocker for hypertension'),(13,'Losartan 50mg','Tablet',8.50,65,'2027-08-31',15,'Angiotensin II blocker for blood pressure'),(14,'Pantoprazole 40mg','Tablet',9.00,95,'2028-03-31',20,'Proton pump inhibitor for GERD & acidity'),(15,'Ibuprofen 400mg','Tablet',4.50,140,'2027-12-31',20,'NSAID pain & inflammation reliever'),(16,'Ciprofloxacin 0.3%','Drops',35.00,40,'2027-09-30',10,'Bacterial conjunctivitis & corneal infection'),(17,'Dextromethorphan Syrup','Syrup',68.00,32,'2027-10-31',10,'Antitussive for dry coughing relief'),(18,'Montelukast + Levocetirizine','Tablet',12.50,55,'2027-07-31',15,'Allergic rhinitis and asthma prophylaxis'),(19,'Insulin Glargine 100IU/ml','Injection',420.00,8,'2026-12-31',10,'Long-acting basal insulin for diabetes'),(20,'Multivitamin + Zinc','Capsule',6.50,150,'2028-01-31',20,'Essential dietary & immune micronutrients'),(21,'Calcium Carbonate + Vit D3','Tablet',7.50,110,'2027-11-30',15,'Bone remineralization & fracture healing'),(22,'Cefixime 200mg','Tablet',18.00,45,'2027-05-31',15,'Cephalosporin antibiotic for systemic infections'),(23,'Tramadol 50mg','Tablet',11.50,25,'2027-04-30',10,'Centrally acting analgesic for moderate pain'),(24,'Domperidone 10mg','Tablet',4.50,90,'2028-02-28',15,'Prokinetic antiemetic for nausea and bloating'),(25,'Loperamide 2mg','Tablet',3.20,60,'2027-06-30',10,'Antidiarrheal motility reducer'),(26,'Betadine Antiseptic 5%','Ointment',48.00,35,'2027-12-31',10,'Topical microbicidal povidone iodine ointment'),(27,'Clotrimazole 1%','Ointment',52.00,50,'2027-08-31',10,'Broad-spectrum antifungal topical cream'),(28,'Levetiracetam 500mg','Tablet',22.00,40,'2027-10-31',10,'Antiepileptic for seizures & neural disorders'),(29,'Sertraline 50mg','Tablet',16.00,9,'2027-09-30',10,'SSRI for depression and panic disorder'),(30,'Ondansetron 4mg','Tablet',7.50,80,'2028-04-30',15,'5-HT3 antagonist antiemetic'),(31,'Amoxicillin + Clavulanate','Tablet',24.00,6,'2026-11-30',10,'Broad spectrum beta-lactamase inhibitor antibiotic');
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
  `must_change_password` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`patient_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient`
--

LOCK TABLES `patient` WRITE;
/*!40000 ALTER TABLE `patient` DISABLE KEYS */;
INSERT INTO `patient` VALUES (1,'Mohan Meena','Male','2006-02-22','8798654512','Mohan@gmail.com','Bhopal','$2a$10$lx4mcw4NHyVGc26.JVGXquP/8MpvQfWlII2IiAI.6gWc7mT0khHja',0),(2,'Aman Bakore','Male','2006-06-20','7898654512','Aman@gmail.com','Indore','$2a$10$lx4mcw4NHyVGc26.JVGXqufzaREuTbvJDKcxROHkyY2f8u56L.Rv2',0),(3,'Anushka','Female','2006-08-14','9886663118','anushka@gmail.com','Harda','anuu14',0),(4,'Karan Joshi','Male','2002-02-22','8798654512','Karan@gmail.com','Mumbai','$2a$10$nEK1pMiWsPTe/JOlXBU.tOkbnm/IWlAzEhK7qlVTRVo7KFmAFWx0u',0),(5,'Kartik Yadav','Male','2009-10-11','8798654512','Kartik@gmail.com','Mumbai','Kartik123',0),(7,'Rohit Sharma','Male','1990-05-02','8798565412','Rohit@gmail.com','Mumbai','Rohit123',0),(8,'Priya Jaat','Female','2006-03-26','8798456545','Priya@gmail.com','Pune','Priya123',0),(9,'Rampal Patel','Male','2000-02-12','8798456545','Rampal@gmail.com','Indore','Rampal123',0),(10,'Rishabh Pal','Male','2006-03-22','9898874565','Rishabh@gmail.com','Kannod','Rishabh123',0),(11,'Dhruv Kashyap','Male','1998-07-15','6265598762','dhruv.kashyap@gmail.com','Harda','Dhruv123',0),(12,'Tanu Yadav','Female','2007-05-18','8785965465','Tanu@gmail.com','Mumbai','Tanu@123',0),(13,'Anmol Dholan','Male','2008-02-11','8798564574','anmol.dholan@gmail.com','Kannod','Anmol123',0),(14,'Harshit Pal','Male','2006-11-22','8798456545','Harshit@gmail.com','Seoni','Harshit123',0),(15,'Vikramaditya Rao','Male','1988-11-16','9876543219','vikram.rao@gmail.com','Indore','$2a$10$lx4mcw4NHyVGc26.JVGXquFcPrQ.80AW28yxcUEkwZH9pLNNWlppW',0),(16,'Kanha Pal','Male','2000-01-01','7489744547','kanha@gmail.com','Ujjain','$2b$10$xbDsBTp6Red2PQ8ZYWMyfeFpxTeA8pwctAukk4xR1TyXMI7RlaboW',0),(17,'Kavita Singhal','Female','1995-04-12','9826112233','kavita@gmail.com','Bhopal','$2a$10$Jn9jvJqrd7F1yPAokmqbdOWVjHbuztkfjGeWPuRktnL4vWE7aSMvu',0),(18,'Deepak Verma','Male','1982-09-25','9826223344','deepak@gmail.com','Indore','$2a$10$Jn9jvJqrd7F1yPAokmqbdO/bgrCW4WTVB0t0/g.kH7tblEGPo4sby',0),(19,'Meera Nair','Female','1978-01-30','9826334455','meera@gmail.com','Pune','$2a$10$Jn9jvJqrd7F1yPAokmqbdOn1FtXlTNeKD/gD.MDqV0v3rg0WO1Agu',0),(20,'Arjun Kapoor','Male','2001-11-05','9826445566','arjun@gmail.com','Delhi','$2a$10$Jn9jvJqrd7F1yPAokmqbdOTYQoaLqSlPQR7sotK6XyT9tApBt3zte',0),(21,'Sanya Mirza','Female','1992-06-18','9826556677','sanya@gmail.com','Hyderabad','$2a$10$Jn9jvJqrd7F1yPAokmqbdOHquY839kuJSnd1G8JW6/Ij9e/MBbI9S',0),(22,'Gaurav Tiwari','Male','1987-12-08','9826667788','gaurav@gmail.com','Jabalpur','$2a$10$Jn9jvJqrd7F1yPAokmqbdODS6q7cq16qUhcf6ybWNLZvukHbo1gfy',0),(23,'Pooja Hegde','Female','1994-03-22','9826778899','pooja.h@gmail.com','Mumbai','$2a$10$Jn9jvJqrd7F1yPAokmqbdOCjWXIa6pLibReIznZtYNF/GjE5VwpMa',0),(24,'Nikhil Jain','Male','2003-07-14','9826889900','nikhil@gmail.com','Gwalior','$2a$10$Jn9jvJqrd7F1yPAokmqbdOgYC.V2DTHm6V/M4aYcDb.zWJ5EEdGmC',0);
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
  `Password` varchar(255) DEFAULT NULL,
  `must_change_password` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`Pharmacist_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pharmacist`
--

LOCK TABLES `pharmacist` WRITE;
/*!40000 ALTER TABLE `pharmacist` DISABLE KEYS */;
INSERT INTO `pharmacist` VALUES (7,'Mohan Meena','8798456545','$2a$10$lx4mcw4NHyVGc26.JVGXquP/8MpvQfWlII2IiAI.6gWc7mT0khHja',0),(8,'Rishabh Pal','6543217890','$2a$10$lx4mcw4NHyVGc26.JVGXquJwJp3ir1W28B4RQqdNUhQQDWVQ5bVHK',0),(9,'Suresh Verma','9876543210','$2a$10$Jn9jvJqrd7F1yPAokmqbdOtiA7aD41B3rTwB7C4WIUsfk1hWG4Bz.',0),(10,'Pooja Sharma','9823456789','$2a$10$Jn9jvJqrd7F1yPAokmqbdOCjWXIa6pLibReIznZtYNF/GjE5VwpMa',0);
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
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescribed_medicine`
--

LOCK TABLES `prescribed_medicine` WRITE;
/*!40000 ALTER TABLE `prescribed_medicine` DISABLE KEYS */;
INSERT INTO `prescribed_medicine` VALUES (1,8,203,1,'Paracetamol','2','10',20,'After Meal','Dispensed'),(2,1,201,2,'Diclofenac','2','7',14,'After Meal','Dispensed'),(3,2,202,1,'Paracetamol','1','10',10,'After Meal','Dispensed'),(4,3,202,4,'Azithromycin','2','15',30,'After meal ','Dispensed'),(5,2,204,2,'Diclofenac','1','10',10,'Before BreakFast','Dispensed'),(6,7,205,7,'Hydrocortisone','1','10',1,'2 Drops in 1 day','Dispensed'),(7,11,202,1,'paracetamol','3','5',10,'before meal','Dispensed'),(8,10,202,1,'Paracetamol','2','10',20,'After Meal','Pending'),(9,10,203,9,' Salbutamol','2','10',20,'After Meal','Dispensed'),(10,14,207,7,'Hydrocortisone','2','10',20,'After Meal','Pending'),(11,15,203,1,'Paracetamol','100','50',50,'after meal in day and night','Dispensed'),(12,15,203,2,'Diclofenac','2','60',12,'after meal in day and night','Pending'),(13,15,203,5,'Cetirizine','1','40',40,'after meal in day and night','Dispensed'),(14,1,201,7,'Hydrocortisone','2','5',10,'After meals','Dispensed'),(15,21,201,11,'Atorvastatin 20mg','1','30',30,'Take 1 tablet at night after dinner','Pending'),(16,21,201,12,'Amlodipine 5mg','1','30',30,'Take 1 tablet daily at 8:00 AM','Pending'),(17,22,202,15,'Ibuprofen 400mg','2','5',10,'Take 1 tablet after meals if headache occurs','Pending'),(18,23,202,28,'Levetiracetam 500mg','1','30',30,'Take 1 tablet twice daily with water','Pending'),(19,5,208,17,'Dextromethorphan Syrup','5ml','5',1,'5ml thrice daily after meals','Pending'),(20,3,210,20,'Multivitamin + Zinc','1','30',30,'Take 1 capsule daily after lunch','Pending'),(21,3,210,21,'Calcium Carbonate + Vit D3','1','30',30,'Take 1 tablet daily with warm milk','Pending'),(22,19,11,14,'Pantoprazole 40mg','1','15',15,'Take 1 capsule on an empty stomach 30 mins before breakfast','Dispensed'),(23,20,201,10,'Metformin','1','30',30,'Take 1 tablet after dinner','Dispensed');
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription`
--

LOCK TABLES `prescription` WRITE;
/*!40000 ALTER TABLE `prescription` DISABLE KEYS */;
INSERT INTO `prescription` VALUES (1,7,203,8,' Fracture','2025-11-11 04:36:59','Take Test','Given'),(2,1,201,1,' High blood pressure','2025-11-11 05:37:36','Reduce Salt','Given'),(3,2,202,2,'Migraine','2025-11-11 05:49:31','wear glasses','Given'),(4,3,202,3,'Parkinsons disease','2025-11-11 05:54:19','Stress control','Given'),(5,5,204,2,'Heart Attack','2025-11-12 06:53:10','Reduce salt','Given'),(7,6,205,7,' Eye Pain','2025-11-12 07:27:13','Use Drops Daily','Given'),(8,9,202,11,'Heart Attack','2025-11-13 05:59:58','Monitor blood pressure twice daily, restrict sodium intake','Given'),(9,11,202,10,' Migraine','2025-11-13 16:11:48','Take Rest','Given'),(10,10,203,10,'Fracture','2025-11-14 01:10:24','Take Rest','Given'),(12,14,207,14,'Brain tumor','2025-11-16 13:31:31','Stress Control','Given'),(13,15,203,15,'Right Femur Fracture','2025-11-17 06:05:52','Strict bed rest for 6 weeks, limb elevation and orthopedic review','Given'),(14,16,201,1,'Pain','2026-10-08 08:33:30','Reduce Cold Water','Given'),(15,21,201,21,'Hypertensive Urgency','2026-10-25 06:00:00','Check blood pressure twice daily, take tablet in morning with water','Given'),(16,24,202,23,'Epilepsy Maintenance','2026-10-22 08:30:00','Do not skip doses, avoid sleep deprivation and screen glare','Given'),(17,25,208,5,'Pediatric Viral Infection','2026-10-29 04:15:00','Plenty of warm fluids, steam inhalation twice daily','Given'),(18,27,210,3,'Nutritional Deficiency & Fatigue','2026-10-30 10:50:00','Healthy balanced diet, daily morning sunlight walk','Given');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refer_patient`
--

LOCK TABLES `refer_patient` WRITE;
/*!40000 ALTER TABLE `refer_patient` DISABLE KEYS */;
INSERT INTO `refer_patient` VALUES (1,4,205,204,'Suspected dermatological autoimmune lesion; referred to Dermatology for biopsy & clinical correlation','2025-11-12 06:59:48'),(2,2,11,203,'Persistent chronic joint pain and suspected meniscal tear; referred to Orthopedics for MRI evaluation','2026-10-11 14:13:20'),(3,1,11,202,'Patient with chronic renal insufficiency reporting frequent migraine episodes; referred to Neurology for neurovascular assessment.','2026-10-27 05:50:00'),(4,2,201,211,'Persistent nocturnal cough and wheezing post-cardiac stabilization; referred to Pulmonology for spirometry correlation.','2026-10-28 09:15:00'),(5,18,11,203,'Severe lumbar-sacral pain with radiating discomfort to lower right limb; referred to Orthopedics for lumbar MRI.','2026-10-29 05:00:00'),(6,22,202,212,'Patient exhibiting signs of somatic symptom disorder with sleep disruption; referred to Psychiatry for cognitive evaluation.','2026-10-30 09:40:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reorder_request`
--

LOCK TABLES `reorder_request` WRITE;
/*!40000 ALTER TABLE `reorder_request` DISABLE KEYS */;
INSERT INTO `reorder_request` VALUES (1,1,'Paracetamol',9,10,50,'2025-11-10 05:04:11','Approved'),(2,1,'Paracetamol',9,10,50,'2025-11-11 04:41:10','Approved'),(3,1,'Paracetamol',9,10,100,'2025-11-11 08:46:27','Approved'),(4,4,'Azithromycin',10,10,50,'2025-11-11 08:50:19','Approved'),(5,7,'Hydrocortisone',24,10,76,'2025-11-13 06:11:01','Rejected'),(6,1,'Paracetamol',94,10,6,'2025-11-14 07:07:38','Approved'),(7,1,'Paracetamol',100,10,5001,'2025-11-17 06:13:51','Approved'),(8,2,'Diclofenac',36,10,50,'2025-11-17 06:24:23','Approved'),(9,7,'Hydrocortisone',90,10,50,'2026-10-12 07:43:20','Rejected'),(10,5,'Cetirizine',68,10,50,'2026-10-12 07:44:50','Approved'),(11,19,'Insulin Glargine 100IU/ml',8,10,50,'2026-10-30 03:00:00','Pending'),(12,31,'Amoxicillin + Clavulanate',6,10,100,'2026-10-30 03:45:00','Pending'),(13,29,'Sertraline 50mg',9,10,60,'2026-10-30 04:30:00','Pending'),(14,11,'Atorvastatin 20mg',12,15,100,'2026-10-25 06:15:00','Approved'),(15,15,'Ibuprofen 400mg',14,20,150,'2026-10-24 08:50:00','Approved');
/*!40000 ALTER TABLE `reorder_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_procurement_history`
--

DROP TABLE IF EXISTS `stock_procurement_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_procurement_history` (
  `procurement_id` int NOT NULL AUTO_INCREMENT,
  `medicine_id` int NOT NULL,
  `medicine_name` varchar(100) NOT NULL,
  `supplier_name` varchar(150) NOT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `quantity` int NOT NULL,
  `expiry_date` date NOT NULL,
  `previous_stock` int DEFAULT '0',
  `disposed_expired_units` int DEFAULT '0',
  `new_stock` int NOT NULL,
  `unit_price` decimal(10,2) DEFAULT '0.00',
  `total_cost` decimal(10,2) DEFAULT '0.00',
  `invoice_no` varchar(50) DEFAULT NULL,
  `procured_by` varchar(100) DEFAULT 'Hospital Admin',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`procurement_id`),
  KEY `medicine_id` (`medicine_id`),
  CONSTRAINT `stock_procurement_history_ibfk_1` FOREIGN KEY (`medicine_id`) REFERENCES `medicine` (`medicine_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_procurement_history`
--

LOCK TABLES `stock_procurement_history` WRITE;
/*!40000 ALTER TABLE `stock_procurement_history` DISABLE KEYS */;
INSERT INTO `stock_procurement_history` VALUES (1,5,'Cetirizine','Sun Pharma Distributors','BATCH-SUN-9921',50,'2028-10-15',68,68,50,3.00,150.00,'INV-SP-82194','Rishabh Pal','2026-10-12 08:06:47'),(2,6,'Omeprazole','Sun Pharma Distributors','BATCH-OME-6391',25,'2028-10-12',65,65,25,6.00,150.00,'INV-21536','Rishabh Pal','2026-10-12 08:22:05'),(3,11,'Atorvastatin 20mg','Cipla Healthcare Ltd','BATCH-CIP-4402',120,'2028-06-30',0,0,120,14.50,1740.00,'INV-CIP-90123','Hospital Admin','2026-10-20 04:30:00'),(4,14,'Pantoprazole 40mg','Sun Pharma Distributors','BATCH-SUN-5519',100,'2028-03-31',5,0,95,9.00,900.00,'INV-SUN-88412','Hospital Admin','2026-10-21 06:00:00'),(5,20,'Multivitamin + Zinc','Mankind Pharma Ltd','BATCH-MAN-7721',150,'2028-01-31',0,0,150,6.50,975.00,'INV-MAN-33109','Hospital Admin','2026-10-22 08:30:00'),(6,21,'Calcium Carbonate + Vit D3','Dr. Reddy\'s Laboratories','BATCH-DRR-1192',120,'2027-11-30',10,0,110,7.50,900.00,'INV-DRR-66521','Hospital Admin','2026-10-23 04:15:00'),(7,16,'Ciprofloxacin 0.3%','Abbott Healthcare','BATCH-ABT-8834',50,'2027-09-30',0,0,40,35.00,1750.00,'INV-ABT-12044','Hospital Admin','2026-10-24 09:50:00');
/*!40000 ALTER TABLE `stock_procurement_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'hospital_management_system'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-31 20:55:30
