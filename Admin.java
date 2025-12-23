import java.sql.*;
import java.util.InputMismatchException;
import java.util.Scanner;

public class Admin {
    static Scanner sc = new Scanner(System.in);
     static final String URL = "jdbc:mysql://localhost:3306/Hospital_management_system";
    static final String USER = "root";
    static final String PASS = "Rishabh@2218";
    public static void adminLogin() {
        
    

        System.out.println("=== Welcome to Hospital Management System ===");

        System.out.print("Enter Username: ");
        String username = sc.nextLine();

        System.out.print("Enter Password: ");
        String password = sc.nextLine();
        System.out.println();

        try {

            Class.forName("com.mysql.cj.jdbc.Driver");

            Connection conn = DriverManager.getConnection(URL, USER, PASS);
            

            if (checkLogin(conn, username, password)) {
                System.out.println("Login Successful! Welcome Admin ");
                System.out.println();
                showAdminMenu(conn, sc);
            } else {
                System.out.println("\nInvalid Username or Password. Please try again!");
            }

            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    
}
    public static void main(String[] args) {
        Admin admin = new Admin();
        admin.adminLogin();
    }

    public static boolean checkLogin(Connection conn, String username, String password) throws SQLException {
        String query = "SELECT * FROM admin WHERE username=? AND password=?";
        PreparedStatement ps = conn.prepareStatement(query);
        ps.setString(1, username);
        ps.setString(2, password);
        ResultSet rs = ps.executeQuery();
        
        boolean login = rs.next();
        rs.close();
        ps.close();
        return login;
    }

    public static void showAdminMenu(Connection conn, Scanner sc) throws SQLException {
    while (true) {
        System.out.println("\n====== Admin Dashboard ======");
        System.out.println("1. Manage Doctors");
        System.out.println("2. Manage Pharmacists");
        System.out.println("3. Manage Patients");
        System.out.println("4. Generate Revenue Report");
        System.out.println("5. Monitor Stock & Compliance");
        System.out.println("6. Logout");
        System.out.print("Enter your choice: ");

        try {
            int choice = sc.nextInt();
            sc.nextLine();

            switch (choice) {
                case 1:
                    manageDoctors(conn, sc);
                    break;
                case 2:
                    managePharmacists(conn, sc);
                    break;
                case 3:
                    managePatients(conn, sc);
                    break;
                case 4:
                    generateRevenueReport(conn);
                    break;
                case 5:
                    monitorStockCompliance(conn, sc);
                    break;
                case 6:
                    System.out.println("Logging out...");
                    return;
                default:
                    System.out.println("Invalid choice. Try again!");
            }
        } catch (java.util.InputMismatchException e) {
            System.out.println("Invalid input! Please enter a number (1-6).");
            sc.nextLine();
        }
    }
}

public static void manageDoctors(Connection conn, Scanner sc) throws SQLException {
    while (true) {
        System.out.println();
        System.out.println("\n-- Manage Doctors --");
        System.out.println("1. Add Doctor");
        System.out.println("2. View All Doctors");
        System.out.println("3. Update Doctor by ID");
        System.out.println("4. Exit");
        System.out.print("Enter choice: ");
    int ch=0;
            try {
                ch=sc.nextInt();
                sc.nextLine();
                
            } catch (Exception e) {
              System.out.println("Invalid input! Please enter numbers only (1-4)");
              sc.nextLine();
              continue;
            }
        if (ch == 1) {
            int doctor_id = 0;
            while (true) {
                System.out.print("Enter Doctor ID: ");
                try {
                    doctor_id = sc.nextInt();
                    sc.nextLine();
                    break;
                } catch (InputMismatchException e) {
                    System.out.println(" Invalid input! Please enter a valid numeric Doctor ID.");
                    sc.nextLine();
                }
            }

            PreparedStatement checkPs = conn.prepareStatement("SELECT COUNT(*) FROM Doctor WHERE doctor_id = ?");
            checkPs.setInt(1, doctor_id);
            ResultSet checkRs = checkPs.executeQuery();
            checkRs.next();
            int count = checkRs.getInt(1);
            checkRs.close();
            checkPs.close();
            if (count > 0) {
                System.out.println("Doctor ID already exists!");
                continue;
            }

            String name = "";
    do {
            System.out.print("Enter Doctor Name: ");
            name = sc.nextLine();

        if (name.trim().isEmpty()) {
            System.out.println("Name cannot be empty!");
        } else if (!name.matches("[a-zA-Z ]+")) {
            System.out.println("Name cannot contain numbers or special characters!");
            name = ""; 
    }

    } while (name.trim().isEmpty());

            String specialization = "";
            do {
                System.out.print("Enter Specialization: ");
                specialization = sc.nextLine();
                if (specialization.trim().isEmpty()) System.out.println(" Specialization cannot be empty!");
            } while (specialization.trim().isEmpty());

            String contect_num = "";
            do {
                System.out.print("Enter Contact Number: ");
                contect_num = sc.nextLine();
                if (!contect_num.matches("^[6-9]\\d{9}$"))
                    System.out.println(" Enter a valid 10-digit number (should not start with 0,1,2,3,4,5)!");
            } while (!contect_num.matches("^[6-9]\\d{9}$"));

            String Email = "";
            do {
                System.out.print("Enter Email: ");
                Email = sc.nextLine();
                if (!Email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$"))
                    System.out.println(" Invalid email format! Example: example@gmail.com");
            } while (!Email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$"));

            String Password = "";
            do {
                System.out.print("Enter Password (min 6 chars): ");
                Password = sc.nextLine();
                if (Password.length() < 6)
                    System.out.println(" Password must be at least 6 characters long!");
            } while (Password.length() < 6);

            Double Fees = 0.0;
            do {
                System.out.print("Enter Consultation Fees: ");
                while (!sc.hasNextDouble()) {
                    System.out.println(" Please enter a valid number!");
                    sc.next();
                }
                Fees = sc.nextDouble();
                if (Fees <= 0)
                    System.out.println(" Fees must be positive!");
            } while (Fees <= 0);

            PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO Doctor (Doctor_id,name, specialization, contact_no, email, password,fees)  VALUES (?,?,?,?,?,?,?)");
            ps.setInt(1, doctor_id);
            ps.setString(2, name);
            ps.setString(3, specialization);
            ps.setString(4, contect_num);
            ps.setString(5, Email);
            ps.setString(6, Password);
            ps.setDouble(7, Fees);
            ps.executeUpdate();
            System.out.println(" Doctor Added Successfully!\n");
            ps.close();

        } else if (ch == 2) {
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT doctor_id,name,specialization, contact_no, email,fees FROM Doctor");

            System.out.println(
                    "\n-------------------------------------------------------------------------------------------------------------");
            System.out.printf("%-5s %-20s %-25s %-15s %-25s %-10s\n",
                    "ID", "Name", "Specialization", "Contact No", "Email", "Fees");
            System.out.println(
                    "-------------------------------------------------------------------------------------------------------------");

            while (rs.next()) {
                System.out.printf("%-5d %-20s %-25s %-15s %-25s %-10.2f\n",
                        rs.getInt("doctor_id"),
                        rs.getString("name"),
                        rs.getString("specialization"),
                        rs.getString("contact_no"),
                        rs.getString("email"),
                        rs.getDouble("fees"));
            }

            System.out.println(
                    "-------------------------------------------------------------------------------------------------------------");

            rs.close();
            stmt.close();

        } else if (ch == 3) {
              
            int id=0;
             while (true) {
                System.out.print("Enter Doctor ID to Update: ");
                try {
                    id = sc.nextInt();
                    sc.nextLine();
                    break;
                } catch (InputMismatchException e) {
                    System.out.println(" Invalid input! Please enter a valid numeric Doctor ID.");
                    sc.nextLine();
                }
            }

            PreparedStatement check = conn.prepareStatement("SELECT * FROM Doctor WHERE doctor_id=?");
            check.setInt(1, id);
            ResultSet rs = check.executeQuery();
            if (!rs.next()) {
                System.out.println("Doctor not found!");
                rs.close();
                check.close();
                continue;
            }
            rs.close();
            check.close();

            String name;
            do {
                System.out.print("Enter New Name: ");
                name = sc.nextLine();
                if (name.trim().isEmpty()) System.out.println(" Name cannot be empty!");
            } while (name.trim().isEmpty());

            String contact;
            do {
                System.out.print("Enter New Contact No (10 digits): ");
                contact = sc.nextLine();
                if (!contact.matches("^[6-9]\\d{9}$"))
                    System.out.println(" Enter a valid 10-digit contact number!");
            } while (!contact.matches("^[6-9]\\d{9}$"));

            String email;
            do {
                System.out.print("Enter New Email: ");
                email = sc.nextLine();
                if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$"))
                    System.out.println(" Invalid email format e.g = Example@gmail.com !");
            } while (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$"));

            String pass;
            do {
                System.out.print("Enter New Password (min 6 chars): ");
                pass = sc.nextLine();
                if (pass.length() < 6)
                    System.out.println(" Password must be at least 6 characters long!");
            } while (pass.length() < 6);

            PreparedStatement ps = conn.prepareStatement(
                    "UPDATE Doctor SET name=?, contact_no=?, email=?, password=? WHERE doctor_id=?");
            ps.setString(1, name);
            ps.setString(2, contact);
            ps.setString(3, email);
            ps.setString(4, pass);
            ps.setInt(5, id);
            int rows = ps.executeUpdate();
            if (rows > 0)
                System.out.println(" Doctor details updated successfully!");
            else
                System.out.println(" Update failed!");
            ps.close();

        } else if (ch == 4) {
            return;
        } else {
            System.out.println("Invalid choice!");
        }
    }
}

    public static void managePharmacists(Connection conn, Scanner sc) throws SQLException {
        while (true) {
            System.out.println();
            System.out.println("\n-- Manage Pharmacists --");
            System.out.println("1. Add Pharmacist");
            System.out.println("2. View All Pharmacists");
            System.out.println("3. Delete Pharmacist");
            System.out.println("4. Exit");
            System.out.print("Enter choice: ");
            int ch=0;
            try {
                ch=sc.nextInt();
                sc.nextLine();
                
            } catch (Exception e) {
              System.out.println("Invalid input! Please enter numbers only (1-4)");
              sc.nextLine();
              continue;
            }

            switch (ch) {
                case 1:
                   
          String name = "";
do {
    System.out.print("Enter Pharmacist Name: ");
    name = sc.nextLine();

    if (name.trim().isEmpty()) {
        System.out.println("Name cannot be empty!");
    } else if (!name.matches("[a-zA-Z ]+")) {
        System.out.println("Name cannot contain numbers or special characters!");
        name = ""; 
    }

} while (name.trim().isEmpty());
        String contact= "";
do {
    System.out.print("Enter Contact Number: ");
    contact= sc.nextLine();

  
    if (!contact.matches("^[6-9]\\d{9}$")) {
        System.out.println("Enter a valid 10-digit number (should not start with 0,1,2,3,4,5)!");
    }

} while (!contact.matches("^[6-9]\\d{9}$"));

String password = "";
        do {
            System.out.print("Enter Password (min 6 chars): ");
            password = sc.nextLine();
            if (password.length() < 6) {
                System.out.println(" Password must be at least 6 characters long!");
            }
        } while (password.length() < 6);
        
                    PreparedStatement psAdd = conn.prepareStatement(
                            "INSERT INTO pharmacist (name,contact_no,password) VALUES (?, ?, ?)");
                    psAdd.setString(1, name);
                    psAdd.setString(2, contact);
                    psAdd.setString(3, password);
                    psAdd.executeUpdate();
                    psAdd.close();
                    System.out.println(" Pharmacist added successfully!");
                    break;

                case 2:
                    Statement stmt = conn.createStatement();
                    ResultSet rs = stmt.executeQuery("SELECT pharmacist_id,name,contact_no FROM pharmacist");
                   boolean found = false;
                    System.out.println("\n---------------------------------------------------------------");
                    System.out.printf("%-10s %-20s %-15s\n",
                            "ID", "Name", "Contact No");
                    System.out.println("---------------------------------------------------------------");

                    while (rs.next()) {
                        found=true;
                        System.out.printf("%-10d %-20s %-15s\n",
                                rs.getInt("pharmacist_id"),
                                rs.getString("name"),
                                rs.getString("contact_no"));
                    }
                    System.out.println("---------------------------------------------------------------");

                    if(!found){
                        System.out.println("No pharmacists found!");
                    }
                    rs.close();
                    stmt.close();
                    break;

                case 3:

                    System.out.print("Enter Pharmacist ID to delete: ");
                    int deleteId = sc.nextInt();
                    PreparedStatement psDel = conn.prepareStatement(
                            "DELETE FROM pharmacist WHERE pharmacist_id=?");
                    psDel.setInt(1, deleteId);
                    int rows = psDel.executeUpdate();
                    psDel.close();
                    if (rows > 0)
                        System.out.println("Pharmacist deleted successfully!");
                    else
                        System.out.println("Pharmacist ID not found!");
                    break;
                case 4:
                    return;

                default:
                    System.out.println("Invalid choice!");
            }
        }
    }

    public static void managePatients(Connection conn, Scanner sc) throws SQLException {
        while(true){
        System.out.println("\n-- Manage Patients --");
        System.out.println("1. View Information All The Patients ");
        System.out.println("2. Exit");
          int ch=0;
            try {
                ch=sc.nextInt();
                sc.nextLine();
                
            } catch (Exception e) {
              System.out.println("Invalid input! Please enter numbers only (1-2)");
              sc.nextLine();
              continue;
            }
        switch (ch) {
            case 1:
                Statement stmt = conn.createStatement();
                ResultSet rs = stmt.executeQuery("SELECT patient_id,name,gender,dob,contact_no,email,address FROM patient");

                System.out.println(
                        "\n-----------------------------------------------------------------------------------------------------------------------------");
                System.out.printf("%-5s %-20s %-10s %-12s %-15s %-25s %-20s\n",
                        "ID", "Name", "Gender", "DOB", "Contact No", "Email", "Address");
                System.out.println(
                        "-----------------------------------------------------------------------------------------------------------------------------");

                while (rs.next()) {
                    System.out.printf("%-5d %-20s %-10s %-12s %-15s %-25s %-20s\n",
                            rs.getInt("patient_id"),
                            rs.getString("name"),
                            rs.getString("gender"),
                            rs.getString("dob"),
                            rs.getString("contact_no"),
                            rs.getString("email"),
                            rs.getString("address"));
                }
                System.out.println(
                        "-----------------------------------------------------------------------------------------------------------------------------");

                rs.close();
                stmt.close();
                break;
            case 2:
                return;

            default:
                System.out.println("Invalid choice!");
        }
    }
}

    public static void generateRevenueReport(Connection con) {
    try {

        String query = "SELECT SUM(total_amount) AS total_revenue FROM bill WHERE payment_status = 'Paid'";
        PreparedStatement ps = con.prepareStatement(query);
        ResultSet rs = ps.executeQuery();

        System.out.println("\n----------- TOTAL REVENUE ---------");

        if (rs.next()) {
            double revenue = rs.getDouble("total_revenue");
            if (rs.wasNull()) {
                System.out.println("No paid bills found! Revenue = $0.0");
            } else {
                System.out.println("Total Revenue : $" + revenue);
            }
        } else {
            System.out.println("No revenue data found!");
        }

        
        String query1 = "SELECT COUNT(*) AS total_paid_patients FROM bill WHERE payment_status = 'Paid'";
        PreparedStatement ps1 = con.prepareStatement(query1);
        ResultSet rs1 = ps1.executeQuery(); 


        if (rs1.next()) {
            int total_patients = rs1.getInt("total_paid_patients");
            if (rs1.wasNull()) {
                System.out.println("No paid patients found!");
            } else {
                System.out.println("Total Paid Patients : " + total_patients);
            }
        } else {
            System.out.println("No patient data found!");
        }

        System.out.println("---------------------------------------");

        
        ps.close();
        rs1.close();
        ps1.close();

    } catch (Exception e) {
        e.printStackTrace();
    }
}


    public static void monitorStockCompliance(Connection conn, Scanner sc) throws SQLException {

    System.out.println("\n==== MONITOR STOCK & COMPLIANCE ====");

    PreparedStatement ps = conn.prepareStatement(
            "SELECT medicine_id, name, stock_quantity, reorder_level, expiry_date FROM medicine");
    ResultSet rs = ps.executeQuery();

    System.out.printf("%-10s %-20s %-15s %-15s %-20s %-15s%n",
            "Med_ID", "Name", "Stock_Qty", "Reorder_Level", "Expiry_Date", "Status");
    System.out.println("----------------------------------------------------------------------------------------");

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
    System.out.println("----------------------------------------------------------------------------------------");

    System.out.println("\n Checking for pending reorder requests...");
    PreparedStatement checkReq = conn.prepareStatement(
            "SELECT request_id, medicine_id, medicine_name, current_stock, reorder_level, requested_quantity, status FROM reorder_request WHERE status = 'Pending'");
    ResultSet reqRs = checkReq.executeQuery();

    boolean hasRequest = false;
    while (reqRs.next()) {
        hasRequest = true;
        int reqId = reqRs.getInt("request_id");
        int medId = reqRs.getInt("medicine_id");
        String medName = reqRs.getString("medicine_name");
        int reqQty = reqRs.getInt("requested_quantity");
        int currStock = reqRs.getInt("current_stock");

        System.out.println("\n Pending Request Found:");
        System.out.println("Request ID     : " + reqId);
        System.out.println("Medicine ID    : " + medId);
        System.out.println("Medicine Name  : " + medName);
        System.out.println("Current Stock  : " + currStock);
        System.out.println("Requested Qty  : " + reqQty);

  String choice;

while (true) {
    System.out.print("Do you want to APPROVE this reorder? (yes/no): ");
    choice = sc.nextLine().trim().toLowerCase();

    if (choice.equals("yes")) {

        
        PreparedStatement updateStock = conn.prepareStatement(
                "UPDATE medicine SET stock_quantity = stock_quantity + ? WHERE medicine_id = ?");
        updateStock.setInt(1, reqQty);
        updateStock.setInt(2, medId);
        int rows = updateStock.executeUpdate();

        if (rows > 0) {
            PreparedStatement updateStatus = conn.prepareStatement(
                    "UPDATE reorder_request SET status = 'Approved' WHERE request_id = ?");
            updateStatus.setInt(1, reqId);
            updateStatus.executeUpdate();

            System.out.println(" Reorder approved successfully!");
            System.out.println(" Updated stock for " + medName + ": " + (currStock + reqQty));
        } else {
            System.out.println(" Failed to update stock for " + medName);
        }

        break; 
    }

    else if (choice.equals("no")) {

        
        PreparedStatement reject = conn.prepareStatement(
                "UPDATE reorder_request SET status = 'Rejected' WHERE request_id = ?");
        reject.setInt(1, reqId);
        reject.executeUpdate();

        System.out.println(" Request rejected for " + medName);

        break; 
    }

    else {
        System.out.println("Invalid input! Please type only 'yes' or 'no'.");
    }
}


    System.out.println("\n Stock & compliance monitoring complete!");
    System.out.println("----------------------------------------------------------------------------------------");
  }
    }
}