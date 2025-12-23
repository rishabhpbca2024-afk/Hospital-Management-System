
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Scanner;

public class Pharmacist {

    static Scanner sc = new Scanner(System.in);
    static final String URL = "jdbc:mysql://localhost:3306/Hospital_managemnet_system";
    static final String USER = "root";
    static final String PASS = "Rishabh@2218";

    public static void PharmacistLogin() {
        System.out.println("----->>>>> Pharmacist Login Page <<<<<------");
        System.out.println("-----------------------------------------------");

        System.out.print("Enter Your Name :");
        String name = sc.nextLine();
        System.out.print("Enter your Password :");
        String Password = sc.nextLine();
        System.out.println();

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");

            Connection conn = DriverManager.getConnection(URL, USER, PASS);
            PreparedStatement ps = conn.prepareStatement("SELECT * FROM Pharmacist WHERE name = ? AND Password = ?");
            ps.setString(1, name);
            ps.setString(2, Password);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                System.out.println("Login successful! Welcome " + rs.getString("Name"));
                System.out.println();
                PharmacistMenu(conn, sc);
            } else {
                System.out.println("Invalid name or Password. Please try again.!!!!!!!");
                return;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    public static void ViewPrescription(Connection conn, Scanner sc) {
        String query = "SELECT * FROM prescription";
        try (PreparedStatement ps = conn.prepareStatement(query);
                ResultSet rs = ps.executeQuery()) {

            System.out.println(
                    "\n----------------------------------------------------------------------------------------------------------------------------------------------");
            System.out.printf("| %-3s | %-5s | %-6s | %-10s | %-12s | %-20s | %-50s | %-6s |\n",
                    "ID", "App_ID", "Doc_ID", "Patient_ID", "Diagnosis", "Date", "Notes", "Status");
            System.out.println(
                    "----------------------------------------------------------------------------------------------------------------------------------------------");

            boolean found = false;
            while (rs.next()) {
                found = true;
                System.out.printf("| %-3d | %-5d | %-6d | %-10d | %-12s | %-20s | %-50s | %-6s |\n",
                        rs.getInt("prescription_id"),
                        rs.getInt("appointment_id"),
                        rs.getInt("doctor_id"),
                        rs.getInt("patient_id"),
                        rs.getString("diagnosis"),
                        rs.getTimestamp("prescription_date"),
                        rs.getString("notes"),
                        rs.getString("status"));
            }

            if (!found) {
                System.out.println(
                        "| No prescription found!                                                                                                                                   |");
            }
            System.out.println(
                    "----------------------------------------------------------------------------------------------------------------------------------------------");

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static void DispenseMedicine(Connection conn, Scanner sc) {
        try {
            System.out.print("Enter Prescription ID to dispense medicine: ");
            int prescriptionId = sc.nextInt();
            sc.nextLine();

            PreparedStatement checkPs = conn.prepareStatement("SELECT * FROM prescription WHERE prescription_id = ?");
            checkPs.setInt(1, prescriptionId);
            ResultSet rs = checkPs.executeQuery();

            if (!rs.next()) {
                System.out.println("No prescription found with ID: " + prescriptionId);
                return;
            }

            System.out.print("Enter Patient ID: ");
            int PatientId = sc.nextInt();
            System.out.print("Enter Medicine ID: ");
            int medicineId = sc.nextInt();
            sc.nextLine();

            PreparedStatement stockCheck = conn
                    .prepareStatement("SELECT stock_quantity, reorder_level, name FROM medicine WHERE medicine_id = ?");
            stockCheck.setInt(1, medicineId);
            ResultSet stockRs = stockCheck.executeQuery();

            if (!stockRs.next()) {
                System.out.println("Medicine not found in stock!");
                return;
            }

            int availableStock = stockRs.getInt("stock_quantity");
            int reorderLevel = stockRs.getInt("reorder_level");
            String medName = stockRs.getString("name");

            System.out.print("Enter Medicine Name: ");
            String medicineName = sc.nextLine();

            System.out.print("Enter Dosage (e.g. 1 tablet twice a day): ");
            String dosage = sc.nextLine();

            System.out.print("Enter Duration (e.g. 5 days): ");
            String duration = sc.nextLine();

            System.out.print("Enter Quantity: ");
            int quantity = sc.nextInt();
            sc.nextLine();

            if (quantity > availableStock) {
                System.out.println("Not enough stock! Available quantity: " + availableStock);
                return;
            }

            System.out.print("Enter Instructions (e.g. After meal): ");
            String instructions = sc.nextLine();

            PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO dispensed_medicine (prescription_id, Patient_id, medicine_id, medicine_name, dosage, duration, quantity, instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

            ps.setInt(1, prescriptionId);
            ps.setInt(2, PatientId);
            ps.setInt(3, medicineId);
            ps.setString(4, medicineName);
            ps.setString(5, dosage);
            ps.setString(6, duration);
            ps.setInt(7, quantity);
            ps.setString(8, instructions);

            int rows = ps.executeUpdate();
            if (rows > 0) {

                PreparedStatement updateStock = conn.prepareStatement(
                        "UPDATE medicine SET stock_quantity = stock_quantity - ? WHERE medicine_id = ?");
                updateStock.setInt(1, quantity);
                updateStock.setInt(2, medicineId);
                updateStock.executeUpdate();

                System.out.println("Medicine dispensed successfully!");
                PreparedStatement pss = conn
                        .prepareStatement("Update Appointment set status='Given' where prescription_id=?");
                pss.setInt(1, prescriptionId);
                pss.executeUpdate();

                PreparedStatement newStock = conn
                        .prepareStatement("SELECT stock_quantity FROM medicine WHERE medicine_id = ?");
                newStock.setInt(1, medicineId);
                ResultSet newStockRs = newStock.executeQuery();

                if (newStockRs.next()) {
                    int remainingStock = newStockRs.getInt("stock_quantity");
                    System.out.println("Remaining stock for " + medName + ": " + remainingStock);

                    if (remainingStock <= reorderLevel) {
                        System.out.println(
                                " Stock for " + medName + " is below reorder level! Consider restocking soon.");
                    }
                }
            } else {
                System.out.println("Failed to dispense medicine.");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void PharmacistMenu(Connection conn, Scanner sc) {
        while (true) {
            System.out.println("---->>> Pharmacist Menu <<<----");
            System.out.println("-------------------------------");
            System.out.println("1.Check Prescription");
            System.out.println("2.Dispence Medicine");
            System.out.println("3.Track expiry and Stock");
            System.out.println("4.Raise re-order request");
            System.out.println("5.Exit");
            int choice = sc.nextInt();
            switch (choice) {
                case 1:
                    ViewPrescription(conn, sc);
                    break;
                case 2:
                    DispenseMedicine(conn, sc);
                    break;
                case 3:
                    // TrackExpiryAndStock(conn);
                    break;
                case 4:
                    // RaiseReorderRequest(conn);
                    break;
                case 5:
                    System.out.println("Logging out...");
                    return;
                default:
                    System.out.println("Invalid choice!");
            }

        }
    }

    public static void main(String[] args) {
        Pharmacist.PharmacistLogin();
    }
}
