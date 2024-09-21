-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.4.28-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for db_ai
CREATE DATABASE IF NOT EXISTS `db_ai` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `db_ai`;

-- Dumping structure for table db_ai.analytics_result
CREATE TABLE IF NOT EXISTS `analytics_result` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) DEFAULT NULL,
  `session` varchar(255) DEFAULT NULL,
  `ai_sensitivity` varchar(255) DEFAULT NULL,
  `ai_spesificity` varchar(255) DEFAULT NULL,
  `ai_ppv` varchar(255) DEFAULT NULL,
  `ai_auc` varchar(255) DEFAULT NULL,
  `uc_sensitivity` varchar(255) DEFAULT NULL,
  `uc_spesificity` varchar(255) DEFAULT NULL,
  `uc_ppv` varchar(255) DEFAULT NULL,
  `uc_auc` varchar(255) DEFAULT NULL,
  `score` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table db_ai.history_chat
CREATE TABLE IF NOT EXISTS `history_chat` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) DEFAULT NULL,
  `human_message` varchar(255) DEFAULT NULL,
  `ai_message` varchar(255) DEFAULT NULL,
  `session` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
