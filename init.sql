  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    zalo_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    zalo_id VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL, 
    check_in_morning DATETIME DEFAULT NULL,
    check_out_morning DATETIME DEFAULT NULL,
    check_in_afternoon DATETIME DEFAULT NULL,
    check_out_afternoon DATETIME DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_zalo_date (zalo_id, `date`),
    
    FOREIGN KEY (zalo_id) REFERENCES users(zalo_id) ON DELETE CASCADE,
    INDEX idx_zalo_id (zalo_id),
    INDEX idx_date (`date`)
  );

  CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL, -- Tên công việc
  description TEXT, -- Chi tiết
  assignee_id VARCHAR(255) NOT NULL, -- Người làm (Zalo ID)
  assigner_id VARCHAR(255) NOT NULL, -- Người giao (Admin Zalo ID)
  due_date DATETIME NOT NULL, -- Thời hạn (Deadline)
  
  -- Trạng thái công việc
  status ENUM('pending', 'submitted', 'completed', 'rework') DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Liên kết khóa ngoại
  CONSTRAINT fk_task_assignee FOREIGN KEY (assignee_id) REFERENCES users(zalo_id) ON DELETE CASCADE,
  CONSTRAINT fk_task_assigner FOREIGN KEY (assigner_id) REFERENCES users(zalo_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;