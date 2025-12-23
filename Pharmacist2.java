
import java.sql.*;
import java.util.InputMismatchException;
import java.util.Scanner;

public class Pharmacist2 {

    static Scanner sc = new Scanner(System.in);
    static final String URL = "jdbc:mysql://localhost:3306/Hospital_management_system";
    static final String USER = "root";
    static final String PASS = "Rishabh@2218";

    public static void PharmacistLogin() {
        System.out.println("----->>>>> Pharmacist Login Page <<<<<------");
        System.out.println("-----------------------------------------------");
        while (true) {
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
                    break;
                } else {
                    System.out.println("Invalid name or Password. Please try again.!!!!!!!");

                }

            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    public static void ViewPrescribedMedicine(Connection conn, Scanner sc) {

        String query = "SELECT * FROM prescribed_medicine WHERE Status = 'Pending'";

        try (PreparedStatement ps = conn.prepareStatement(query); ResultSet rs = ps.executeQuery()) {

            if (rs.isBeforeFirst()) {
                System.out.println(
                        "\n-------------------------------------------------------------------------------------------------------------------------------------");
                System.out.printf("| %-8s | %-12s | %-12s | %-15s | %-10s | %-10s | %-9s | %-15s | %-10s |\n",
                        "Pres_ID", "Patient_ID", "Medicine_ID", "Medicine_Name", "Dosage", "Duration", "Quantity",
                        "Instructions", "Status");
                System.out.println(
                        "---------------------------------------------------------------------------------------------------------------------------------------");

                boolean found = false;
                while (rs.next()) {
                    found = true;
                    System.out.printf("| %-8d | %-12d | %-12d | %-15s | %-10s | %-10s | %-9d | %-15s | %-10s |\n",
                            rs.getInt("prescribed_id"),
                            rs.getInt("patient_id"),
                            rs.getInt("medicine_id"),
                            rs.getString("medicine_name"),
                            rs.getString("dosage"),
                            rs.getString("duration"),
                            rs.getInt("quantity"),
                            rs.getString("instructions"),
                            rs.getString("Status"));
                }
                System.out.println(
                        "-----------------------------------------------------------------------------------------------------------------------------------");

            } else {
                System.out.println(" No prescribed medicine found !!!!! ");
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static void DispenseMedicine(Connection conn, Scanner sc) {
    try {
        PreparedStatement ps0 = conn.prepareStatement(
                "SELECT status FROM prescribed_medicine WHERE status='Pending'"
        );
        ResultSet rs0 = ps0.executeQuery();

        if (!rs0.next()) {
            System.out.println("No Prescribed Medicine Found");
            return;
        }

        int prescribedId;
        while (true) {
            try {
                System.out.print("Enter Prescribed ID to dispense medicine: ");
                prescribedId = sc.nextInt();
                sc.nextLine();
                break;
            } catch (InputMismatchException e) {
                System.out.println("Invalid input! Enter a numeric Prescribed ID.");
                sc.nextLine(); 
            }
        }

        PreparedStatement checkPs = conn.prepareStatement(
                "SELECT * FROM prescribed_medicine WHERE prescribed_id = ?"
        );
        checkPs.setInt(1, prescribedId);
        ResultSet rs = checkPs.executeQuery();

        if (!rs.next()) {
            System.out.println("No prescription found with ID: " + prescribedId);
            return;
        }

        int prescribedPatientId = rs.getInt("patient_id");
        int prescribedMedicineId = rs.getInt("medicine_id");
        String prescribedMedicineName = rs.getString("medicine_name");
        String prescribedDosage = rs.getString("dosage");
        String prescribedDuration = rs.getString("duration");
        String prescribedInstructions = rs.getString("instructions");
        int prescribedQty = rs.getInt("quantity");

        PreparedStatement ps3 = conn.prepareStatement(
                "SELECT status FROM prescribed_medicine WHERE status='Dispensed' AND prescribed_id=?"
        );
        ps3.setInt(1, prescribedId);
        ResultSet rs2 = ps3.executeQuery();

        if (rs2.next()) {
            System.out.println("Medicine already dispensed!");
            return;
        }

        int patientId;
        while (true) {
            try {
                System.out.print("Enter Patient ID: ");
                patientId = sc.nextInt();
                sc.nextLine();
                if (patientId != prescribedPatientId) {
                    System.out.println("Patient ID does not match the prescription!");
                } else {
                    break;
                }
            } catch (InputMismatchException e) {
                System.out.println("Invalid input! Please enter numeric Patient ID.");
                sc.nextLine();
            }
        }

        int medicineId;
        while (true) {
            try {
                System.out.print("Enter Medicine ID: ");
                medicineId = sc.nextInt();
                sc.nextLine();
                if (medicineId != prescribedMedicineId) {
                    System.out.println("Medicine ID does not match the prescription!");
                } else {
                    break; 
                }
            } catch (InputMismatchException e) {
                System.out.println("Invalid input! Enter numeric Medicine ID.");
                sc.nextLine();
            }
        }

        PreparedStatement stockCheck = conn.prepareStatement(
                "SELECT stock_quantity, reorder_level, name FROM medicine WHERE medicine_id = ?"
        );
        stockCheck.setInt(1, medicineId);
        ResultSet stockRs = stockCheck.executeQuery();

        if (!stockRs.next()) {
            System.out.println("Medicine not found in stock.");
            return;
        }

       int availableStock = stockRs.getInt("stock_quantity");
int reorderLevel = stockRs.getInt("reorder_level");
String stockMedName = stockRs.getString("name");

String medicineName;
while (true) {
    System.out.print("Enter Medicine Name: ");
    medicineName = sc.nextLine().trim();
    if (medicineName.isEmpty()) {
        System.out.println("Medicine name cannot be empty. Please enter a valid name.");
    } else if (!medicineName.matches("[a-zA-Z ]+")) {
        System.out.println("Invalid input! Please enter a valid medicine name (alphabets only).");
    } else if (!medicineName.equalsIgnoreCase(prescribedMedicineName) 
               && !medicineName.equalsIgnoreCase(stockMedName)) {
        System.out.println("Medicine name does not match Prescription/Stock! Please try again.");
    } else {
        break;
    }
}
        String dosage;
        while (true) {
            System.out.print("Enter Dosage: ");
            dosage = sc.nextLine().trim();
            if (dosage.equalsIgnoreCase(prescribedDosage.trim())) {
                break;
            } else {
                System.out.println("Dosage does not match prescription!");
            }
        }

        String duration;
        while (true) {
            System.out.print("Enter Duration: ");
            duration = sc.nextLine().trim();
            if (duration.equalsIgnoreCase(prescribedDuration)) {
                break;
            } else {
                System.out.println("Duration does not match prescription!");
            }
        }

        int quantity = prescribedQty;

        if (quantity > availableStock) {
            System.out.println("Not enough stock! Available: " + availableStock);

            String confirmDispense = "";
            while (true) {
                System.out.print("Do you want to dispense the available quantity of " + availableStock + " units? (yes/no): ");
                confirmDispense = sc.nextLine().trim().toLowerCase();

                if (confirmDispense.equals("yes")) {
                    quantity = availableStock;
                    break;
                } else if (confirmDispense.equals("no")) {
                    System.out.println("No medicine dispensed.");
                    return;
                } else {
                    System.out.println("Invalid input! Please enter 'yes' or 'no'.");
                }
            }
        }

        String instructions;
        while (true) {
            System.out.print("Enter Instructions: ");
            instructions = sc.nextLine().trim();
            if (instructions.equalsIgnoreCase(prescribedInstructions)) {
                break; 
            } else {
                System.out.println("Instructions do not match prescription!");
            }
        }

        PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO dispensed_medicine (prescribed_id, patient_id, medicine_id, medicine_name, dosage, duration, quantity, instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );

        ps.setInt(1, prescribedId);
        ps.setInt(2, patientId);
        ps.setInt(3, medicineId);
        ps.setString(4, medicineName);
        ps.setString(5, dosage);
        ps.setString(6, duration);
        ps.setInt(7, quantity);
        ps.setString(8, instructions);

        int rows = ps.executeUpdate();

        if (rows > 0) {

            PreparedStatement updateStock = conn.prepareStatement(
                    "UPDATE medicine SET stock_quantity = stock_quantity - ? WHERE medicine_id = ?"
            );
            updateStock.setInt(1, quantity);
            updateStock.setInt(2, medicineId);
            updateStock.executeUpdate();

            System.out.println("Medicine dispensed successfully!");

            PreparedStatement ps4 = conn.prepareStatement(
                    "UPDATE prescribed_medicine SET status='Dispensed' WHERE prescribed_id=?"
            );
            ps4.setInt(1, prescribedId);
            ps4.executeUpdate();

            PreparedStatement newStock = conn.prepareStatement(
                    "SELECT stock_quantity FROM medicine WHERE medicine_id = ?"
            );
            newStock.setInt(1, medicineId);
            ResultSet newStockRs = newStock.executeQuery();

            if (newStockRs.next()) {
                int remainingStock = newStockRs.getInt("stock_quantity");
                System.out.println("Remaining stock for " + stockMedName + ": " + remainingStock);

                if (remainingStock <= reorderLevel) {
                    System.out.println("Stock below reorder level! Consider restocking.");
                }
            }

            Patient.GenerateBill(patientId);

        } else {
            System.out.println("Failed to dispense medicine.");
        }

    } catch (Exception e) {
        e.printStackTrace();
    }
}

    public static void TrackExpiryAndStock(Connection conn, Scanner sc) {
        try {
            System.out.println("\n==== Medicine Stock and Expiry Tracking ====");
            PreparedStatement ps = conn.prepareStatement(
                    "SELECT medicine_id, name, stock_quantity, reorder_level, expiry_date FROM medicine ORDER BY expiry_date ASC");
            ResultSet rs = ps.executeQuery();

            System.out.printf("%-10s %-20s %-15s %-15s %-20s %-15s%n",
                    "Med_ID", "Name", "Stock_Qty", "Reorder_Level", "Expiry_Date", "Status");
            System.out.println(
                    "----------------------------------------------------------------------------------------");

            boolean found = false;
            while (rs.next()) {
                found = true;
                int stock = rs.getInt("stock_quantity");
                int reorder = rs.getInt("reorder_level");
                Date expiry = rs.getDate("expiry_date");
                String status = "";

                if (expiry.before(new java.util.Date())) {
                    status = " EXPIRED";
                } else if (stock <= reorder) {
                    status = " LOW STOCK";
                } else {
                    status = " OK";
                }

                System.out.printf("%-10d %-20s %-15d %-15d %-20s %-15s%n",
                        rs.getInt("medicine_id"),
                        rs.getString("name"),
                        stock,
                        reorder,
                        expiry,
                        status);
            }

            if (!found) {
                System.out.println("No medicines found in inventory.");
            }
            System.out.println(
                    "----------------------------------------------------------------------------------------");
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static void RaiseReorderRequest(Connection conn, Scanner sc) {
        try {
            System.out.println("\n==== Raise Reorder Request ====");
            System.out.print("Enter Medicine ID: ");
            int medId = sc.nextInt();
            sc.nextLine();

            PreparedStatement ps = conn.prepareStatement("SELECT * FROM medicine WHERE medicine_id = ?");
            ps.setInt(1, medId);
            ResultSet rs = ps.executeQuery();

            if (!rs.next()) {
                System.out.println("Medicine not found!");
                return;
            }

            String name = rs.getString("name");
            int currentStock = rs.getInt("stock_quantity");
            int reorderLevel = rs.getInt("reorder_level");

            System.out.print("Enter Quantity to Reorder: ");
            int reqQty = sc.nextInt();
            sc.nextLine();

            PreparedStatement insert = conn.prepareStatement(
                    "INSERT INTO reorder_request (medicine_id, medicine_name, current_stock, reorder_level, requested_quantity) VALUES (?, ?, ?, ?, ?)");
            insert.setInt(1, medId);
            insert.setString(2, name);
            insert.setInt(3, currentStock);
            insert.setInt(4, reorderLevel);
            insert.setInt(5, reqQty);

            int rows = insert.executeUpdate();
            if (rows > 0) {
                System.out.println(" Reorder request for " + name + " placed successfully!");
            } else {
                System.out.println(" Failed to place reorder request.");
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static void PharmacistMenu(Connection conn, Scanner sc) {
        while (true) {
            System.out.println("\n---->>> Pharmacist Menu <<<----");
            System.out.println("-------------------------------");
            System.out.println("1. Check Prescription");
            System.out.println("2. Dispense Medicine");
            System.out.println("3. Track Expiry and Stock");
            System.out.println("4. Raise Reorder Request");
            System.out.println("5. Exit");
            System.out.print("Enter choice: ");
            int choice;

            try {
                choice = sc.nextInt();
                sc.nextLine();

            } catch (Exception e) {
                System.out.println("Invalid input! Please enter numbers only (1-6)");
                sc.nextLine();
                continue;
            }

            switch (choice) {
                case 1:
                    ViewPrescribedMedicine(conn, sc);
                    break;
                case 2:
                    DispenseMedicine(conn, sc);
                    break;
                case 3:
                    TrackExpiryAndStock(conn, sc);
                    break;
                case 4:
                    RaiseReorderRequest(conn, sc);
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
        Pharmacist2.PharmacistLogin();
    }
}
