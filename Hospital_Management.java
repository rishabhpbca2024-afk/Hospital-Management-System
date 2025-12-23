import java.sql.*;
import java.util.Scanner;

public class Hospital_Management {
    public static void main(String[] args) throws Exception {

        Class.forName("com.mysql.cj.jdbc.Driver");
        Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/hospital_management_system?useSSL=false&serverTimezone=UTC", "root", "Rishabh@2218");
        Scanner ss = new Scanner(System.in);

        while (true) {
            System.out.println("\n----->>> USER MANAGEMENT SYSTEM <<<------");
            System.out.println("1. Registration");
            System.out.println("2. Login");
            System.out.println("3. Exit");
            System.out.print("Enter your choice: ");
            int choice = ss.nextInt();
            ss.nextLine(); 

            if (choice == 1) {
                System.out.println("\n----->>>>>> Registration Page <<<<<-------");
                System.out.print("Enter Your ID : ");
                int id = ss.nextInt();
                ss.nextLine();
                System.out.print("Enter Your Name : ");
                String name = ss.nextLine();
                System.out.print("Enter Your Gender : ");
                String gender = ss.nextLine();
                System.out.print("Enter Your DoB (YYYY/MM/DD) : ");
                String dob = ss.nextLine();
                System.out.print("Enter Your Phone Number : ");
                String phone = ss.nextLine();
                System.out.print("Enter Your Gmail : ");
                String gmail = ss.nextLine();
                System.out.print("Enter Your Address : ");
                String address = ss.nextLine();
                System.out.print("Enter the Password : ");
                String password = ss.nextLine();

                PreparedStatement check = con.prepareStatement("SELECT * FROM Patient WHERE email=?");
                check.setString(1, gmail);
                ResultSet chk = check.executeQuery();

                if (chk.next()) {
                    System.out.println("Gmail already registered. Try Login instead!");
                } else {
                    PreparedStatement ps = con.prepareStatement("INSERT INTO Patient VALUES(?, ?, ?, ?, ?, ?, ?, ?)");
                    ps.setInt(1, id);
                    ps.setString(2, name);
                    ps.setString(3, gender);
                    ps.setString(4, dob);
                    ps.setString(5, phone);
                    ps.setString(6, gmail);
                    ps.setString(7, address);
                    ps.setString(8, password);
                    ps.executeUpdate();
                    System.out.println("Registration Successfully!");
                    ps.close();
                }
                chk.close();
                check.close();
            }

            else if (choice == 2) {
                System.out.println("\n----->>>>>> Login Page <<<<<-------");
                System.out.print("Enter your role (Patient/Doctor/Admin/Pharmacist): ");
                String role = ss.nextLine();

                if (role.equalsIgnoreCase("Patient")) {
                    System.out.print("Enter Your email : ");
                    String gmail = ss.nextLine();
                    System.out.print("Enter Your Password : ");
                    String password = ss.nextLine();

                    PreparedStatement ps = con.prepareStatement("SELECT * FROM Patient WHERE email=? AND Password=?");
                    ps.setString(1, gmail);
                    ps.setString(2, password);
                    ResultSet rs = ps.executeQuery();

                    if (rs.next()) {
                        System.out.println("Login Successful! welcome, " + rs.getString("Name"));

                        while (true) {
                            System.out.println("\n------>>>> Patients Menu <<<<-----:");
                            System.out.println("1. Search Doctors by Specialization");
                            System.out.println("2. Book Appointment");
                            System.out.println("3. View Appointments");
                            //System.out.println("3. View Prescriptions");
                            System.out.println("4. Logout");
                            System.out.print("Enter your choice: ");
                            int patientChoice = ss.nextInt();
                            ss.nextLine();

                            if (patientChoice == 1) {
                                System.out.println("Enter Specialization (e.g., Orthopedic Surgeon, Oncologist, Ophthalmologist, Neurologist, Dermatologist): ");
                                String specialization = ss.nextLine();
                                PreparedStatement ps1 = con.prepareStatement("SELECT * FROM Doctor WHERE Specialization=?");
                                ps1.setString(1, specialization);
                                ResultSet rs1 = ps1.executeQuery();

                                System.out.println("\nDoctors with specialization " + specialization + ":");
                                while (rs1.next()) {
                                    System.out.println("Doctor ID: " + rs1.getInt("Doctor_id") + 
                                                       ",\nName: " + rs1.getString("Name") + 
                                                       ",\nContact_no: " + rs1.getString("Contact_no") + 
                                                       ",\nEmail: " + rs1.getString("email"));
                                }
                                rs1.close();
                                ps1.close();
                            }

                            else if (patientChoice == 2) {
                                System.out.print("Enter appointment Id : ");
                                int Id = ss.nextInt();
                                ss.nextLine();
                                System.out.print("Enter Patient Id : ");
                                int Patient_Id = ss.nextInt();
                                ss.nextLine();
                                System.out.print("Enter Doctor Id : ");
                                int doctor_id = ss.nextInt();
                                ss.nextLine();
                                System.out.print("Enter Appointment Date (YYYY:MM:DD): ");
                                String appointment_date = ss.nextLine();

                                PreparedStatement ps2 = con.prepareStatement("INSERT INTO Appointment(appointment_id,patient_id,doctor_id,appointment_date) VALUES (?, ?, ?, ?)");
                                ps2.setInt(1, Id);
                                ps2.setInt(2, Patient_Id);
                                ps2.setInt(3, doctor_id);
                                ps2.setString(4, appointment_date);
                                ps2.executeUpdate();
                                System.out.println("Appointment booked successfully!");
                                ps2.close();
                            }
                            else if (patientChoice == 3) {
                                PreparedStatement ps3 = con.prepareStatement("SELECT * FROM Appointment WHERE patient_id=(SELECT Patient_id FROM Patient WHERE email=?)");
                                ps3.setString(1, gmail);
                                ResultSet rs3 = ps3.executeQuery();

                                System.out.println("\nYour Appointments:");
                                System.out.println("---------------------------------------------------------------------------------");
                                System.out.printf("%-15s %-15s %-15s %-20s %-10s%n",
                                        "Appointment_Id", "Patient_Id", "Doctor_Id", "Appointment_Date", "Status");
                                System.out.println("---------------------------------------------------------------------------------");

                                while (rs3.next()) {
                                    System.out.printf("%-15d %-15d %-15d %-20s %-10s%n",
                                            rs3.getInt("appointment_id"),
                                            rs3.getInt("patient_id"),
                                            rs3.getInt("doctor_id"),
                                            rs3.getString("appointment_date"),
                                            rs3.getString("status"));
                                }
                                System.out.println("---------------------------------------------------------------------------------");
                                rs3.close();
                                ps3.close();
                            }
                            

                            // else if (patientChoice == 3) {
                            //     PreparedStatement ps3 = con.prepareStatement("SELECT * FROM Prescriptions WHERE Patient_email=?");
                            //     ps3.setString(1, gmail);
                            //     ResultSet rs3 = ps3.executeQuery();

                            //     System.out.println("\nYour Prescriptions:");
                            //     while (rs3.next()) {
                            //         System.out.println("Prescription ID: " + rs3.getInt("Prescription_id") + 
                            //                            ", Doctor ID: " + rs3.getInt("Doctor_id") + 
                            //                            ", Medication: " + rs3.getString("Medication") + 
                            //                            ", Dosage: " + rs3.getString("Dosage"));
                            //     }
                            //     rs3.close();
                            //     ps3.close();
                            // }

                            else if (patientChoice == 4) {
                                System.out.println("Logging out...");
                                break;
                            } 
                            else {
                                System.out.println("Invalid choice! Try again.");
                            }
                        }
                    } 
                    else {
                        System.out.println("Invalid Gmail or Password!");
                    }
                    rs.close();
                    ps.close();
                }

                else if (role.equalsIgnoreCase("Doctor")) {
                    System.out.print("Enter Your Gmail : ");
                    String gmail = ss.nextLine();
                    System.out.print("Enter Your Password : ");
                    String password = ss.nextLine();

                    PreparedStatement ps = con.prepareStatement("SELECT * FROM Doctor WHERE email=? AND Password=?");
                    ps.setString(1, gmail);
                    ps.setString(2, password);
                    ResultSet rs = ps.executeQuery();

                    if (rs.next()) {
                        System.out.println("Login Successful!");
                                            System.out.println("------>>>> Doctor Menu <<<<-----");

                        while (true) {
                            System.out.println("1. View Appointments");
                            System.out.println("2. Logout");
                            System.out.print("Enter your choice: ");
                            int choice2 = ss.nextInt();
                            ss.nextLine();
                            if(choice2==1){
                                PreparedStatement ps1=con.prepareStatement("SELECT * FROM Appointment");
                                ResultSet rs1=ps1.executeQuery();
                                System.out.println("\nYour Appointments:");
System.out.println("---------------------------------------------------------------------------------");
System.out.printf("%-15s %-15s %-15s %-20s %-10s%n",
        "Appointment_Id", "Patient_Id", "Doctor_Id", "Appointment_Date", "Status");
System.out.println("---------------------------------------------------------------------------------");

                                while(rs1.next()){
                                    System.out.printf("%-15d %-15d %-15d %-20s %-10s%n",
            rs1.getInt("appointment_id"),
            rs1.getInt("patient_id"),
            rs1.getInt("doctor_id"),
            rs1.getString("appointment_date"),
            rs1.getString("status"));
                                }
                                System.out.println("---------------------------------------------------------------------------------");
                                System.out.println("You can update the status of appointments (e.g., Accept, Reject, Completed)");
                                System.out.print("Enter Appointment Id to update status : ");
                                int appId = ss.nextInt();
                                ss.nextLine();
                                System.out.print("Enter new status (Accept/Reject/Completed) : ");
                                String newStatus = ss.nextLine();
                                PreparedStatement ps2 = con.prepareStatement("UPDATE Appointment SET status=? WHERE appointment_id=?");
                                ps2.setString(1, newStatus);
                                ps2.setInt(2, appId);
                                ps2.executeUpdate();
                                System.out.println("Appointment status updated successfully.");
                            }


                            else if(choice2==2){
                                System.out.println("Logging out...");
                                break;
                            }
                    } 
                    
                }
                    
                    else {
                        System.out.println("Invalid Gmail or Password!");
                    }
                    rs.close();
                    ps.close();
                }

                else if (role.equalsIgnoreCase("Admin")) {
                    System.out.print("Enter Your Username : ");
                    String username = ss.nextLine();
                    System.out.print("Enter Your Password : ");
                    String password = ss.nextLine();

                    PreparedStatement ps = con.prepareStatement("SELECT * FROM Admin WHERE username=? AND Password=?");
                    ps.setString(1, username);
                    ps.setString(2, password);
                    ResultSet rs = ps.executeQuery();

                    if (rs.next()) {
                        System.out.println("Login Successful!");
                    } else {
                        System.out.println("Invalid Username or Password!");
                    }
                    rs.close();
                    ps.close();
                }

                else if (role.equalsIgnoreCase("Pharmacist")) {
                    System.out.print("Enter Your Id : ");
                    int id = ss.nextInt();
                    ss.nextLine();
                    System.out.print("Enter Your Password : ");
                    String password = ss.nextLine();

                    PreparedStatement ps = con.prepareStatement("SELECT * FROM Pharmacist WHERE Pharmacist_id=? AND Password=?");
                    ps.setInt(1, id);
                    ps.setString(2, password);
                    ResultSet rs = ps.executeQuery();

                    if (rs.next()) {
                        System.out.println("Login Successful!");
                    } else {
                        System.out.println("Invalid Id or Password!");
                    }
                    rs.close();
                    ps.close();
                }

                else {
                    System.out.println("Invalid Role! Try again.");
                }
            }

            else if (choice == 3) {
                System.out.println("Exiting... Goodbye!");
                break;
            }

            else {
                System.out.println("Invalid choice! Please try again.");
            }
        }

        con.close();
        ss.close();
    }
}
