import java.sql.*;
import java.util.Scanner;

public class Doctor2 {
 static Scanner sc = new Scanner(System.in);
  static final String URL = "jdbc:mysql://localhost:3306/Hospital_management_system";
    static final String USER = "root";
    static final String PASS = "Rishabh@2218";
 public static void DoctorLogin() {
 System.out.println("!!!! Doctor Login !!!!");
 System.out.println("----------------------");
 System.out.print("Enter your Gmail: ");
 String Gmail = sc.nextLine();
 System.out.print("Enter your Password: ");
 String Password = sc.nextLine();
 System.out.println();
 try {
 Class.forName("com.mysql.cj.jdbc.Driver");

 Connection conn = DriverManager.getConnection(URL, USER, PASS);

 String sql = "SELECT * FROM Doctor WHERE email = ? AND Password = ?";
 PreparedStatement pstmt = conn.prepareStatement(sql);
 pstmt.setString(1, Gmail);
 pstmt.setString(2, Password);
 ResultSet rs = pstmt.executeQuery();

 if (rs.next()) {
 System.out.println("Login successful! Welcome " + rs.getString("Name"));
 int doctorId = rs.getInt("doctor_id");
 doctorMenu(conn, sc, doctorId);
 } else {
 System.out.println("Invalid Gmail or Password. Please try again.");
 DoctorLogin();
 }

 } catch (Exception e) {
 e.printStackTrace();
 }
 }

 public static void doctorMenu(Connection conn, Scanner sc, int doctorId) throws SQLException {
 System.out.println("!!!! Welcome to Doctor Menu !!!!");
 System.out.println("---------------------------------");
 while (true) {
 System.out.println("Please select an option:");
 System.out.println("1. View Appointments");
 System.out.println("2. Write Prescription");
 System.out.println("3. Refer Patient to Specialist");
 System.out.println("4. View Patient History");
 System.out.println("5. Logout");
 System.out.print("Enter choice: ");
 int choice;

 try {
 choice = sc.nextInt();
 sc.nextLine();

 } catch (Exception e) {
 System.out.println("Invalid input! Please enter numbers only (1-5)");
 sc.nextLine();
 continue;
 }
 switch (choice) {
 case 1:
 ViewAppointments(conn, sc, doctorId);
 break;
 case 2:
 WritePrescription(conn, sc, doctorId);
 break;
 case 3:
 ReferToSpecialist(conn, sc, doctorId);
 break;
 case 4:
 ViewPatientHistory(conn, sc, doctorId);
 break;
 case 5:
 System.out.println("Logging out...");
 return;
 default:
 System.out.println("Invalid choice! Please try again.");
 }
 }
 }

 public static void ViewAppointments(Connection conn, Scanner sc, int doctorId) throws SQLException {
 System.out.println("!!!! View Appointments !!!!");

 PreparedStatement pstmt = conn.prepareStatement(
  "SELECT * FROM Appointment WHERE doctor_id = ? AND status IN ('Pending..','Accepted')");
 pstmt.setInt(1, doctorId);
 ResultSet rs3 = pstmt.executeQuery();
 int appointmentcheck = 0;
 if (rs3.isBeforeFirst()) {
 appointmentcheck = 1;
 System.out.println("\nYour Appointments:");
 System.out.println(
 "-------------------------------------------------------------------------------------------------------------");
 System.out.printf("%-15s %-15s %-15s %-20s %-10s %-15s%n",
 "Appointment_Id", "Patient_Id", "Doctor_Id", "Appointment_Date", "Status", "Diagnosis");
 System.out.println(
 "---------------------------------------------------------------------------------------------------------------------");

 while (rs3.next()) {
 System.out.printf("%-15d %-15d %-15d %-20s %-10s %-15s%n",
 rs3.getInt("appointment_id"),
 rs3.getInt("patient_id"),
 rs3.getInt("doctor_id"),
 rs3.getString("appointment_date"),
 rs3.getString("status"),
 rs3.getString("diagnosis"));
 }

 System.out.println(
 "---------------------------------------------------------------------------------------------------------------------");
 System.out.println();
 } else {
 System.out.println("\nYou have no appointments scheduled.......!!!!!!");
 System.out.println();
 }
 if (appointmentcheck == 1) {
 String response;
 while (true) {
 System.out.println("Do you want to accept/reject any appointment (yes/no): ");
 response = sc.nextLine();
 if (response.equals("yes") || response.equals("no")) {

 if (response.equalsIgnoreCase("yes")) {
 int appointmentId = -1;
 while (true) {
 try {
 System.out.print("Enter appointment id to accept/reject appointment: ");
 appointmentId = sc.nextInt();
 sc.nextLine();
 break;
 } catch (Exception e) {
 System.out.println(
 "Invalid input! Please enter a valid appointment ID (numbers only). Try again.");
 sc.nextLine();
 }
 }

 String decision;
 while (true) {
 System.out.print("Enter your decision (accept/reject): ");
 decision = sc.nextLine().trim().toLowerCase();

 if (decision.equals("accept") || decision.equals("reject")) {
 break;
 } else {
 System.out.println("Invalid input! Please enter only 'accept' or 'reject'.");
 }
 }

 String updateSql = "UPDATE Appointment SET status = ? WHERE appointment_id = ?";
 PreparedStatement updatePstmt = conn.prepareStatement(updateSql);

 if (decision.equalsIgnoreCase("accept"))
 updatePstmt.setString(1, "Accepted");
 else
 updatePstmt.setString(1, "Rejected");

 updatePstmt.setInt(2, appointmentId);

 int rowsAffected = updatePstmt.executeUpdate();
 if (rowsAffected > 0) {
 System.out.println("Appointment " + decision + "ed successfully.");
 System.out.println();
 } else {
 System.out.println("Invalid Appointment ID. Please try again.");
 }
 }

 break;
 } else {
 System.out.println("Invalid input ! Please enter 'yes' or 'no' only");
 }
 }
 }
 }

 public static void WritePrescription(Connection conn, Scanner sc, int doctorId) {
 int appointmentcheck = 0;
 try {
 PreparedStatement pstmt2 = conn
 .prepareStatement("SELECT * FROM Appointment WHERE doctor_id = ? AND status='Accepted'");

 pstmt2.setInt(1, doctorId);
 ResultSet rs = pstmt2.executeQuery();
 if (rs.next()) {
 appointmentcheck = 1;
 }
 } catch (SQLException e) {
 e.printStackTrace();
 }

 if (appointmentcheck == 0) {
 System.out.println("No appointments found to write a prescription.");
 System.out.println();
 return;
 } else {
 System.out.println("!!!! Write Prescription !!!!");
 System.out.println("-----------------------------");

 int appointmentId = -1;
 while (true) {
 try {
 System.out.print("Enter Appointment ID: ");
 appointmentId = sc.nextInt();
 sc.nextLine();
 break;
 } catch (Exception e) {
 System.out.println("Please enter valid numbers only. Try again.");
 sc.nextLine();
 }
 }

 int patientId = -1;
 while (true) {
 try {
 System.out.print("Enter Patient ID: ");
 patientId = sc.nextInt();
 sc.nextLine();
 break;
 } catch (Exception e) {
 System.out.println("Please enter valid numbers only. Try again.");
 sc.nextLine();
 }
 }

 System.out.print("Enter Diagnosis: ");
 String diagnosis = sc.nextLine();
 System.out.print("Enter Notes: ");
 String notes = sc.nextLine();

 try {
 PreparedStatement pss = conn.prepareStatement("SELECT * FROM Prescription WHERE appointment_id = ?");
 pss.setInt(1, appointmentId);
 ResultSet rs = pss.executeQuery();
 if (rs.next()) {
 System.out.println("Prescription already given for this appointment!");
 return;
 }

 String sql = "INSERT INTO Prescription (appointment_id, patient_id, doctor_id, diagnosis, notes) VALUES (?, ?, ?, ?, ?)";
 PreparedStatement pstmt = conn.prepareStatement(sql);
 pstmt.setInt(1, appointmentId);
 pstmt.setInt(2, patientId);
 pstmt.setInt(3, doctorId);
 pstmt.setString(4, diagnosis);
 pstmt.setString(5, notes);

 int rowsAffected = pstmt.executeUpdate();
 if (rowsAffected > 0) {
 System.out.println("Prescription added successfully.");

 System.out.println("\nNow, add prescribed medicines for this prescription:");

 while (true) {
 try {
 PreparedStatement psShow = conn.prepareStatement("SELECT * FROM medicine");
 ResultSet rsMed = psShow.executeQuery();
 System.out.println("\nAvailable Medicines:");
 System.out.println("---------------------------------------------------------------");
 System.out.printf("%-10s %-25s %-15s %-10s%n", "Medicine_ID ", "Medicine_Name", "Type",
 "Stock");
 System.out.println("---------------------------------------------------------------");
 while (rsMed.next()) {
 System.out.printf("%-10d %-25s %-15s %-10d%n",
 rsMed.getInt("medicine_id"),
 rsMed.getString("name"),
 rsMed.getString("type"),
 rsMed.getInt("stock_quantity"));
 }
 System.out.println("---------------------------------------------------------------");
 } catch (SQLException e) {
 System.out.println("Error fetching medicines list.");
 }

 int medicineId = -1;
while (true) {
    try {
        System.out.print("Enter Medicine ID: ");
        medicineId = sc.nextInt();
        sc.nextLine();

      
        PreparedStatement psCheck = conn.prepareStatement(
            "SELECT * FROM medicine WHERE medicine_id = ?"
        );
        psCheck.setInt(1, medicineId);

        ResultSet rsCheck = psCheck.executeQuery();
        if (rsCheck.next()) {
          
            break;
        } else {
            System.out.println("Medicine ID not found in database! Please enter a valid ID.");
        }

    } catch (Exception e) {
        System.out.println("Please enter valid numbers only. Try again.");
        sc.nextLine();
    }
}


 String medicineName = "";
while (true) {
    System.out.print("Enter Medicine Name: ");
    medicineName = sc.nextLine().trim();

    try {
        PreparedStatement psCheck = conn.prepareStatement(
            "SELECT * FROM medicine WHERE name = ? AND medicine_id=?"
        );
        psCheck.setString(1, medicineName);
        psCheck.setInt(2,medicineId);

        ResultSet rsCheck = psCheck.executeQuery();
        if (rsCheck.next()) {
            
            break;
        } else {
            System.out.println("Medicine not found in database! Please enter a valid medicine name.");
        }
    } catch (SQLException e) {
        System.out.println("Database error! Try again.");
    }
}

 int dosage = 0;
 while (true) {
 try {
 System.out.print("Enter Dosage (number only, e.g. 2): ");
 dosage = sc.nextInt();
 sc.nextLine();
 break;
 } catch (Exception e) {
 System.out.println("Please enter valid numbers only. Try again.");
 sc.nextLine();
 }
 }

 int duration = 0;
 while (true) {
 try {
 System.out.print("Enter Duration (in days, number only): ");
 duration = sc.nextInt();
 sc.nextLine();
 break;
 } catch (Exception e) {
 System.out.println("Please enter valid numbers only. Try again.");
 sc.nextLine();
 }
 }
 int quantity = dosage * duration;
 System.out.println("Total Quantity = " + quantity);

 System.out.print("Enter Instructions (e.g. 'after meal in day and night'): ");
 String instructions = sc.nextLine();

 PreparedStatement psMed = conn.prepareStatement(
 "INSERT INTO prescribed_Medicine (patient_id, doctor_id, medicine_id, medicine_name, dosage, duration, quantity, instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

 psMed.setInt(1, patientId);
 psMed.setInt(2, doctorId);
 psMed.setInt(3, medicineId);
 psMed.setString(4, medicineName);
 psMed.setInt(5, dosage);
 psMed.setInt(6, duration);
 psMed.setInt(7, quantity);
 psMed.setString(8, instructions);

 psMed.executeUpdate();

 System.out.println("Medicine added successfully.");

 System.out.print("Add another medicine? (yes/no): ");
 String choice = sc.nextLine();
 if (choice.equalsIgnoreCase("no")) {
 break;
 }
 }
 

 System.out.println("\n All prescribed medicines added successfully.");
 PreparedStatement ps = conn.prepareStatement(
 "UPDATE Appointment SET Status='Completed' WHERE patient_id=? AND Appointment_Id=?");
 ps.setInt(1, patientId);
 ps.setInt(2, appointmentId);
 ps.executeUpdate();

 PreparedStatement ps01 = conn
 .prepareStatement("Update Prescription set status='Given' where appointment_id=?");
 ps01.setInt(1, appointmentId);
 ps01.executeUpdate();
 } else {
 System.out.println("Failed to add prescription. Please try again.");
 }

 } catch (SQLException e) {
 e.printStackTrace();
 }
 }
 }

 public static void ReferToSpecialist(Connection conn, Scanner sc, int doctorId) {
 int appointmentcheck = 0;
 try {
 PreparedStatement pstmt2 = conn
 .prepareStatement("SELECT * FROM Appointment WHERE doctor_id = ? AND status='Pending'");
 pstmt2.setInt(1, doctorId);
 ResultSet rs = pstmt2.executeQuery();

 if (rs.next()) {
 appointmentcheck = 1;
 }

 } catch (SQLException e) {
 e.printStackTrace();
 }
 if (appointmentcheck == 0) {
 System.out.println("No appointments found to refer a patient.");
 System.out.println();
 return;
 } else {
 System.out.println("!!!! Refer Patient to Specialist !!!!");
 System.out.println("--------------------------------------");
 System.out.println("Enter Patient ID: ");
 int patientId = sc.nextInt();
 sc.nextLine();
 System.out.println("Enter To Specialist Doctor ID: ");
 int toSpecialistId = sc.nextInt();
 sc.nextLine();
 System.out.println("Enter Reason for Referral: ");
 String reason = sc.nextLine();
 try {
 String sql = "INSERT INTO Refer_patient (patient_id, from_doctor_id, to_doctor_id, reason) VALUES (?, ?, ?, ?)";
 PreparedStatement pstmt = conn.prepareStatement(sql);
 pstmt.setInt(1, patientId);
 pstmt.setInt(2, doctorId);
 pstmt.setInt(3, toSpecialistId);
 pstmt.setString(4, reason);

 int rowsAffected = pstmt.executeUpdate();
 if (rowsAffected > 0) {
 System.out.println("Referral added successfully.");
 } else {
 System.out.println("Failed to add referral. Please try again.");
 }
 PreparedStatement updatePstmt = conn
 .prepareStatement("UPDATE Appointment SET status = ? WHERE patient_id = ?");
 updatePstmt.setString(1, "Referred");
 updatePstmt.setInt(2, patientId);
 updatePstmt.executeUpdate();
 } catch (SQLException e) {
 e.printStackTrace();
 }
 }
 }

 public static void ViewPatientHistory(Connection conn, Scanner sc, int doctor_Id) {
 System.out.println("!!!! View Patient History !!!!");
 System.out.println("------------------------------");
 System.out.print("Enter Patient ID: ");
 int patientId = sc.nextInt();
 sc.nextLine();

 try {

 PreparedStatement pstmt1 = conn
 .prepareStatement("SELECT * FROM Appointment WHERE patient_id = ? And Doctor_Id=?");
 pstmt1.setInt(1, patientId);
 pstmt1.setInt(2, doctor_Id);
 ResultSet rs1 = pstmt1.executeQuery();
 if (!rs1.isBeforeFirst()) {
 System.out.println("No appointments found.");
 } else {
 System.out.println("\n================ Appointment History ================");
 System.out.println(
 "------------------------------------------------------------------------------------------------------");
 System.out.printf("%-15s %-15s %-15s %-20s %-15s %-15s%n",
 "Appointment_ID", "Doctor_ID", "Patient_ID", "Date", "Status", "Diagnosis");
 System.out.println(
 "------------------------------------------------------------------------------------------------------");
 while (rs1.next()) {
 System.out.printf("%-15d %-15d %-15d %-20s %-15s %-15s%n",
 rs1.getInt("appointment_id"),
 rs1.getInt("doctor_id"),
 rs1.getInt("patient_id"),
 rs1.getString("appointment_date"),
 rs1.getString("status"),
 rs1.getString("diagnosis"));
 }
 System.out.println(
 "-----------------------------------------------------------------------------------------------------");
 }

 PreparedStatement pstmt2 = conn
 .prepareStatement("SELECT * FROM Prescription WHERE patient_id = ? And doctor_id=?");
 pstmt2.setInt(1, patientId);
 pstmt2.setInt(2, doctor_Id);
 ResultSet rs2 = pstmt2.executeQuery();
 if (!rs2.isBeforeFirst()) {
 System.out.println("No prescriptions found.");
 } else {
 System.out.println("\n================ Prescription History ================");
 System.out.println(
 "-------------------------------------------------------------------------------------------------------------------------");
 System.out.printf("%-15s %-15s %-15s %-20s %-30s%n",
 "Prescription_ID", "Doctor_ID", "Patient_ID", "Diagnosis", "Notes");
 System.out.println(
 "-------------------------------------------------------------------------------------------------------------------------");
 while (rs2.next()) {
 System.out.printf("%-15d %-15d %-15d %-20s %-30s%n",
 rs2.getInt("prescription_id"),
 rs2.getInt("doctor_id"),
 rs2.getInt("patient_id"),
 rs2.getString("diagnosis"),
 rs2.getString("notes"));
 }
 System.out.println(
 "-------------------------------------------------------------------------------------------------------------------------");
 }

 PreparedStatement pstmt4 = conn
 .prepareStatement("SELECT * FROM prescribed_Medicine WHERE patient_id = ? AND doctor_id = ?");
 pstmt4.setInt(1, patientId);
 pstmt4.setInt(2, doctor_Id);
 ResultSet rs4 = pstmt4.executeQuery();
 if (!rs4.isBeforeFirst()) {
 System.out.println("No prescribed medicines found.");
 } else {
 System.out.println("\n================ Prescribed Medicine History ================");
 System.out.println(
 "-------------------------------------------------------------------------------------------------------------------------------");
 System.out.printf("%-15s %-15s %-15s %-20s %-15s %-15s %-15s %-20s%n",
 "Prescribed_ID", "Patient_ID", "Doctor_ID", "Medicine_Name", "Dosage", "Duration", "Quantity",
 "Instructions");
 System.out.println(
 "-------------------------------------------------------------------------------------------------------------------------------");
 while (rs4.next()) {
 System.out.printf("%-15d %-15d %-15d %-20s %-15s %-15s %-15d %-20s%n",
 rs4.getInt("prescribed_id"),
 rs4.getInt("patient_id"),
 rs4.getInt("doctor_id"),
 rs4.getString("medicine_name"),
 rs4.getString("dosage"),
 rs4.getString("duration"),
 rs4.getInt("quantity"),
 rs4.getString("instructions"));
 }
 System.out.println(
 "-------------------------------------------------------------------------------------------------------------------------------");
 }

 PreparedStatement pstmt3 = conn.prepareStatement("SELECT * FROM Refer_patient WHERE patient_id = ?");
 pstmt3.setInt(1, patientId);
 ResultSet rs3 = pstmt3.executeQuery();
 if (!rs3.isBeforeFirst()) {
 System.out.println("No referrals found.");
 } else {
 System.out.println("\n================ Referral History ================");

 System.out.printf("%-10s %-15s %-15s %-15s %-30s %-15s%n",
 "Refer_ID", "Patient_ID", "From_Doctor", "To_Doctor", "Reason", "Refer_Date");
 System.out.println(
 "--------------------------------------------------------------------------------------------------------------");
 while (rs3.next()) {
 System.out.printf("%-10d %-15d %-15d %-15d %-30s %-15s%n",
 rs3.getInt("refer_id"),
 rs3.getInt("patient_id"),
 rs3.getInt("from_doctor_id"),
 rs3.getInt("to_doctor_id"),
 rs3.getString("reason"),
 rs3.getString("refer_date"));
 }
 System.out.println(
 "------------------------------------------------------------------------------------------------------------");
 }

 } catch (SQLException e) {
 e.printStackTrace();
 }
 }

 public static void doctorMenu() {
 while (true) {
 try {
 System.out.println("\n==== Doctor Portal ====");
 System.out.println("1. Login");
 System.out.println("2. Exit");
 System.out.print("Enter your choice: ");

 int choice = sc.nextInt();
 sc.nextLine();

 switch (choice) {
 case 1:
 DoctorLogin();
 break;
 case 2:
 System.out.println("Exiting... Thank you!");
 return;
 default:
 System.out.println("Invalid choice. Please try again.");
 }

 } catch (java.util.InputMismatchException e) {
 System.out.println("Invalid input! Please enter numbers only (1 or 2).");
 sc.nextLine();
 } catch (Exception e) {
 System.out.println("An unexpected error occurred: " + e.getMessage());
 } 
 }
 }

 public static void main(String[] args) {
 doctorMenu();
 }
}