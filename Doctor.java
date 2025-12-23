import java.sql.*;
import java.util.Scanner;

public class Doctor {
       static Scanner sc = new Scanner(System.in);
       static final String URL = "jdbc:mysql://localhost:3306/Hospital_managemnet_system";
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
            int doctorId =rs.getInt("doctor_id");
            doctorMenu(conn,sc,doctorId);
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
            System.out.println("4. Logout");
            System.out.print("Enter choice: ");
            int choice = sc.nextInt();
            sc.nextLine();  
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
                    System.out.println("Logging out...");
                    return;
                default:
                    System.out.println("Invalid choice! Please try again.");
            }
        }
    }
    public static void ViewAppointments(Connection conn, Scanner sc, int doctorId) throws SQLException {
        System.out.println("!!!! View Appointments !!!!");

        

        PreparedStatement pstmt = conn.prepareStatement("SELECT * FROM Appointment WHERE doctor_id = ?");
        pstmt.setInt(1, doctorId);
        ResultSet rs3= pstmt.executeQuery();
        int appointmentcheck = 0;
       if (rs3.isBeforeFirst()) {
               appointmentcheck = 1;
                System.out.println("\nYour Appointments:");
                System.out.println("-------------------------------------------------------------------------------------------------------------");
                System.out.printf("%-15s %-15s %-15s %-20s %-10s %-15s%n",
                        "Appointment_Id", "Patient_Id", "Doctor_Id", "Appointment_Date", "Status","Diagnosis");
                System.out.println("---------------------------------------------------------------------------------------------------------------------");

                while (rs3.next()) {
                
                    System.out.printf("%-15d %-15d %-15d %-20s %-10s %-15s%n",
                            rs3.getInt("appointment_id"),
                            rs3.getInt("patient_id"),
                            rs3.getInt("doctor_id"),
                            rs3.getString("appointment_date"),
                            rs3.getString("status"),
                            rs3.getString("diagnosis"));
                }

                System.out.println("---------------------------------------------------------------------------------------------------------------------");
                System.out.println();
            } else {
                System.out.println("\nYou have no appointments scheduled.......!!!!!!");
                System.out.println();
            }
            if (appointmentcheck == 1) {
            System.out.println("Do you want to accept/reject any appointment (yes/no): ");
            String response = sc.nextLine();
            if (response.equalsIgnoreCase("yes")) {
                System.out.print("Enter Appointment ID: ");
                int appointmentId = sc.nextInt();
                sc.nextLine(); 

                System.out.print("Enter your decision (accept/reject): ");
                String decision = sc.nextLine();

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
        }

    }
    public static void WritePrescription(Connection conn, Scanner sc, int doctorId) {
        int appointmentcheck = 0;
        try {
            
         
        PreparedStatement pstmt2 = conn.prepareStatement("SELECT * FROM Appointment WHERE doctor_id = ?");
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
        }
        else{
       System.out.println("!!!! Write Prescription !!!!");
       System.out.println("-----------------------------");
       System.out.println("Enter Appointment ID: ");
         int appointmentId = sc.nextInt();
         sc.nextLine();
         System.out.println("Enter Patient ID: ");
         int patientId = sc.nextInt();
            sc.nextLine();
            System.out.println("Enter Diagnosis: ");
            String diagnosis = sc.nextLine();
            System.out.println("Enter Notes: ");
            String notes = sc.nextLine();
            try {
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

        PreparedStatement pstmt2 = conn.prepareStatement("SELECT * FROM Appointment WHERE doctor_id = ?");
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
        }
        else{
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
            PreparedStatement updatePstmt = conn.prepareStatement("UPDATE Appointment SET status = ? WHERE patient_id = ?");
            updatePstmt.setString(1, "Referred");
            updatePstmt.setInt(2, patientId);
            updatePstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}

    public static void main(String[] args) {
        DoctorLogin();
    }
}
