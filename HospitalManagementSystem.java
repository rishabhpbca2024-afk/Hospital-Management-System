import java.sql.*;
import java.util.InputMismatchException;
import java.util.Scanner;

public class HospitalManagementSystem {

    static final String URL = "jdbc:mysql://localhost:3306/Hospital_management_system";
    static final String USER = "root";
    static final String PASS = "Rishabh@2218";

    static Connection conn;
    static Scanner sc = new Scanner(System.in);
    static int ch;

    static void MainMenu() throws Exception {

        System.out.println("!!!! Welcome to Hospital Management System !!!!");
        System.out.println("----------------------------------------------");

        while (true) {

            System.out.println("\nPlease select your role:");
            System.out.println("1. Admin Login");
            System.out.println("2. Patient Login/Registration");
            System.out.println("3. Doctor Login");
            System.out.println("4. Pharmacist Login");
            System.out.println("5. Exit");
            System.out.print("Enter choice: ");

            try {

            
                if (!sc.hasNext()) {
                    sc = new Scanner(System.in);
                    System.out.println("Input reset due to interruption! Please enter again.");
                    continue;
                }

               
                if (!sc.hasNextInt()) {
                    sc.nextLine();  
                    System.out.println("Invalid input! Please enter numbers only (1-5).");
                    continue;
                }

             
                ch = sc.nextInt();
                sc.nextLine();

            } catch (InputMismatchException e) {
                System.out.println("Invalid input! Please enter numbers only (1-5).");
                sc.nextLine();
                continue;

            } catch (Exception e) {
                System.out.println("Unexpected interruption! Returning to main menu...");
                sc = new Scanner(System.in);  
                continue;
            }

            switch (ch) {
                case 1:
                    Admin.adminLogin();
                    break;

                case 2:
                    Patient.patientMenu();
                    break;

                case 3:
                    Doctor2.doctorMenu();
                    break;

                case 4:
                    Pharmacist2.PharmacistLogin();
                    break;

                case 5:
                    System.out.println("Exiting the system. Goodbye!");
                    conn.close();
                    System.exit(0);

                default:
                    System.out.println("Invalid choice! Please try again.");
            }
        }
    }

    public static void main(String[] args) throws Exception {
        conn = DriverManager.getConnection(URL, USER, PASS);
        new HospitalManagementSystem().MainMenu();
    }
}
