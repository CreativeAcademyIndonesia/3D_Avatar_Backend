-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: db_ai
-- ------------------------------------------------------
-- Server version	8.0.30

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
-- Table structure for table `analytics_result`
--

DROP TABLE IF EXISTS `analytics_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics_result` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `session` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ai_sensitivity` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ai_spesificity` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ai_ppv` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ai_auc` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `uc_sensitivity` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `uc_spesificity` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `uc_ppv` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `uc_auc` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `score` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics_result`
--

LOCK TABLES `analytics_result` WRITE;
/*!40000 ALTER TABLE `analytics_result` DISABLE KEYS */;
/*!40000 ALTER TABLE `analytics_result` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `history_chat`
--

DROP TABLE IF EXISTS `history_chat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `history_chat` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `human_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `ai_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `session` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `history_chat`
--

LOCK TABLES `history_chat` WRITE;
/*!40000 ALTER TABLE `history_chat` DISABLE KEYS */;
INSERT INTO `history_chat` VALUES (85,'agus','Hallo','Response 1','1','2025-07-07 11:41:45'),(86,'agus','Hallo 2','Response 2','1','2025-07-07 11:41:54'),(87,'asep','Hallo 3','Response 3','2','2025-07-07 11:42:16'),(88,'agus','Hallo 4','Response 4','3','2025-07-07 11:41:54'),(89,'agus','Hallo','Selamat pagi!  Senang bertemu dengan Anda.  Mari kita bahas tentang keperawatan geriatri.\nKeperawatan geriatri fokus pada perawatan kesehatan lansia,  meliputi aspek fisik, mental, dan sosial.\nWHO mendefinisikan lansia sebagai individu berusia 60 tahun ke atas,  sedangkan di Indonesia,  definisi ini bisa bervariasi.\nPermasalahan umum lansia meliputi penurunan fungsi fisik, penyakit kronis, dan isolasi sosial.\nKita akan membahas lebih detail setiap aspek ini. Ada pertanyaan?','20250707_1','2025-07-07 13:22:49'),(90,'agus','Hallo','Selamat pagi!  Senang bertemu dengan Anda.  Mari kita bahas tentang keperawatan geriatri.\nKeperawatan geriatri fokus pada perawatan kesehatan lansia,  meliputi aspek fisik, mental, dan sosial.\nWHO mendefinisikan lansia sebagai individu berusia 60 tahun ke atas,  sedangkan di Indonesia,  definisi ini bisa bervariasi.\nPermasalahan umum lansia meliputi penurunan fungsi fisik, penyakit kronis,  dan isolasi sosial.\nKita akan membahas lebih detail setiap aspek ini. Ada pertanyaan?','20250707_2','2025-07-07 13:27:12'),(91,'agus','Hallo selamat pagi','Selamat pagi juga!  Senang bertemu dengan Anda.  Apa yang ingin Anda tanyakan hari ini tentang keperawatan geriatri?','20250707_4','2025-07-07 13:27:56'),(92,'agus','bagaimana cara membuat skripri tentang ini','Membuat skrip tentang keperawatan geriatri membutuhkan perencanaan yang matang. \nPertama, tentukan tujuan skrip.  Apakah untuk edukasi, simulasi, atau presentasi?\nKedua, riset materi.  Gunakan sumber terpercaya seperti buku teks keperawatan geriatri dan jurnal ilmiah.\nKetiga, buat kerangka skrip.  Bagian-bagian penting meliputi: pengantar, isi (definisi lansia, masalah umum, perawatan, dll.), dan penutup.\nKeempat, tulis naskah dengan bahasa yang mudah dipahami dan lugas.  Gunakan contoh kasus jika perlu.\nTerakhir, ujicoba dan revisi skrip sebelum digunakan.','20250707_4','2025-07-07 13:28:31'),(93,'agus','baik terimakasih selamat tinggal','Sama-sama!  Semoga bermanfaat. Selamat tinggal!','20250707_4','2025-07-07 13:29:44'),(94,'agus','halo selamat malam','Selamat malam juga! Ada yang bisa saya bantu?','20250707_4','2025-07-07 13:30:08'),(95,'agus','Hallo ','Halo! Ada yang bisa saya bantu malam ini?','20250707_4','2025-07-07 13:30:31');
/*!40000 ALTER TABLE `history_chat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  `Column 4` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'AGUS','$2b$10$h5GB5pgzyoqfmmAwqMs9Z.jxkHt/AJ06BwJb5KzkacHNs6xm0oqzy','admin','2025-07-02 12:15:11','2025-07-02 12:15:03'),(2,'UCOK','$2b$10$Cz2t.mEGkh/GAOYogL1FHeOSSCgG.xW4I42H542veluzIUev25uz6','admin','2025-07-03 11:46:28','2025-07-03 11:46:28'),(3,'asep','$2b$10$YK6xlPdiFVrnxyZMCM5s8e/inRO/rvW65KavJ5N4UuixN3VvPfXuK','user','2025-07-07 12:47:16','2025-07-07 12:47:16');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'db_ai'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-11 18:47:37
