
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.InputMismatchException;
import java.util.List;
import java.util.Scanner;

public class Patient {

    static Scanner ss = new Scanner(System.in);

    static void registeredPatient() throws Exception {

        Class.forName("com.mysql.cj.jdbc.Driver");

        Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/Hospital_management_system", "root",
                "Rishabh@2218");

        System.out.println("----->>>>>> Registration Page <<<<<-------");
        System.out.println();
        String name;
        while (true) {
            System.out.print("Enter Your Name: ");
            name = ss.nextLine().trim();

            if (!name.isEmpty() && name.matches("[a-zA-Z]+")) {
                break;
            } else {
                System.out.println("Invalid input. Please enter a valid name with no numbers or special characters.");
            }
        }
        String gender;
        while (true) {
            System.out.print("Enter Your Gender (Male/Female/Other): ");
            gender = ss.nextLine().trim();

            String g = gender.toLowerCase();

            if (g.equals("male") || g.equals("female") || g.equals("other")) {
                System.out.println("Gender accepted: " + gender);
                break;
            } else {
                System.out.println("Invalid gender! Please enter Male, Female, or Other only.");
            }
        }

        String dob;
        while (true) {
            System.out.print("Enter Your DoB (YYYY/MM/DD): ");
            dob = ss.nextLine().trim();

            if (dob.length() == 10 && dob.charAt(4) == '/' || dob.charAt(4) == '-' && dob.charAt(7) == '/'
                    || dob.charAt(7) == '-') {

                break;
            } else {
                System.out.println("Please enter date in correct format (YYYY/MM/DD).");
            }
        }

        String phone;
        while (true) {
            System.out.print("Enter Your Phone Number: ");
            phone = ss.nextLine();

            if (phone.length() != 10) {
                System.out.println("Invalid! Phone number must be exactly 10 digits.");
                continue;
            }

            boolean allDigits = true;
            for (int i = 0; i < phone.length(); i++) {
                if (!Character.isDigit(phone.charAt(i))) {
                    allDigits = false;
                    break;
                }
            }
            if (!allDigits) {
                System.out.println("Invalid! Phone number should contain only digits.");
                continue;
            }

            char firstDigit = phone.charAt(0);
            if (firstDigit != '6' && firstDigit != '7' && firstDigit != '8' && firstDigit != '9') {
                System.out.println("Invalid! Phone number must start with 6, 7, 8, or 9.");
                continue;
            }

            System.out.println("Valid Phone Number!");
            break;
        }

        String gmail;
        while (true) {
            System.out.print("Enter Your Gmail: ");
            gmail = ss.nextLine().trim();

            if (!gmail.contains("@") || !gmail.contains(".")) {
                System.out.println("Gmail must be e.g example@gmail.com");
                continue;
            }

            if (gmail.contains(" ")) {
                System.out.println("Gmail should not contain spaces!");
                continue;
            }

            int atIndex = gmail.indexOf("@");
            int dotIndex = gmail.lastIndexOf(".");

            if (atIndex < 1 || dotIndex < atIndex + 3 || dotIndex == gmail.length() - 1) {
                System.out.println("Invalid Gmail format! e.g example@gmail.com");
                continue;
            }

            break;
        }
        System.out.print("Enter Your Address : ");
        String address = ss.nextLine();
        System.out.print("Enter the Password : ");
        String password = ss.nextLine();
        PreparedStatement check = con.prepareStatement("SELECT * FROM Patient WHERE email=?");
        check.setString(1, gmail);
        ResultSet rsCheck = check.executeQuery();
        if (rsCheck.next()) {
            System.out.println("\nGmail already registered. Try Again!");
            System.out.println("--------------------------------");
            System.out.println();
            return;
        }
        PreparedStatement ps = con.prepareStatement(
                "insert into Patient(name,gender,dob,contact_no,email,address,password) values(?,?,?,?,?,?,?)");

        ps.setString(1, name);
        ps.setString(2, gender);
        ps.setString(3, dob);
        ps.setString(4, phone);
        ps.setString(5, gmail);
        ps.setString(6, address);
        ps.setString(7, password);
        ps.executeUpdate();
        System.out.println("Registration successful!");
        System.out.println("--------------------------------");
        System.out.println();

        PreparedStatement ps2 = con.prepareStatement("select * from Patient where password=? and email=?");
        ps2.setString(1, password);
        ps2.setString(2, gmail);
        ResultSet rs2 = ps2.executeQuery();
        System.out.println("Your Details:");
        int patient_id = 0;
        if (rs2.next()) {
            System.out.println("Patient ID: " + rs2.getInt("Patient_id")
                    + ",\nName: " + rs2.getString("Name")
                    + ",\nGender: " + rs2.getString("Gender")
                    + ",\nDate of Birth: " + rs2.getString("DoB")
                    + ",\nPhone Number: " + rs2.getString("Contact_no")
                    + ",\nEmail: " + rs2.getString("Email")
                    + ",\nAddress: " + rs2.getString("Address"));
            patient_id = rs2.getInt("Patient_id");
            System.out.println("-----------------------------------------");
        }
        System.out.println("--------------------------------");
        System.out.println();

        while (true) {
            System.out.println("Patient Menu:");
            System.out.println("1. Search Doctors");
            System.out.println("2. View Appointments");
            System.out.println("3. Book Appointment");
            System.out.println("4. View Prescription");
            System.out.println("5. Refer to Specialist");

            System.out.println("6. Exit");
            int choice;

            try {
                choice = ss.nextInt();
                ss.nextLine();

            } catch (Exception e) {
                System.out.println("Invalid input! Please enter numbers only (1-6)");
                ss.nextLine();
                continue;
            }
            switch (choice) {
                case 1:
                    SearchDoctors();
                    break;
                case 2:
                    ViewAppointments(patient_id);
                    break;
                case 3:
                    BookAppointment(patient_id);
                    break;
                case 4:
                    ViewPrescription(patient_id);
                    break;
                case 5:
                    ReferToSpecialist(patient_id);
                    break;
                case 6:
                    System.out.println("Exiting...");
                    return;
                default:
                    System.out.println("Invalid option.");
            }
        }

    }

    static void loginPatient() throws Exception {

        Class.forName("com.mysql.cj.jdbc.Driver");
        try (Connection con = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/Hospital_management_system", "root", "Rishabh@2218")) {

            System.out.println("\n----->>>>>> Login Page <<<<<-------");
            System.out.print("Enter your gmail: ");
            String gmail = ss.nextLine();
            System.out.print("Enter your password: ");
            String password = ss.nextLine();

            PreparedStatement ps = con.prepareStatement(
                    "SELECT * FROM Patient WHERE email=? AND password=?");
            ps.setString(1, gmail);
            ps.setString(2, password);

            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                System.out.println("Login successful!");
                System.out.println("Welcome, " + rs.getString("name") + "!");
                System.out.println("--------------------------------");

                int patientId = rs.getInt("patient_id");

                PreparedStatement ps2 = con.prepareStatement(
                        "SELECT p.*, pm.prescribed_id "
                        + "FROM Patient p LEFT JOIN prescribed_Medicine pm ON pm.patient_id = p.patient_id "
                        + "WHERE p.patient_id = ?");
                ps2.setInt(1, patientId);
                ResultSet rs2 = ps2.executeQuery();
                int prescribed_id = 0;
                System.out.println("Your Details:");
                while (rs2.next()) {
                    System.out.println("Patient ID: " + rs2.getInt("patient_id")
                            + ",\nPrescribed ID: " + rs2.getInt("prescribed_id")
                            + ",\nName: " + rs2.getString("name")
                            + ",\nGender: " + rs2.getString("gender")
                            + ",\nDate of Birth: " + rs2.getString("dob")
                            + ",\nPhone Number: " + rs2.getString("contact_no")
                            + ",\nEmail: " + rs2.getString("email")
                            + ",\nAddress: " + rs2.getString("address"));
                    prescribed_id = rs2.getInt("prescribed_id");
                    System.out.println("-----------------------------------------");

                }
                System.out.println("--------------------------------");
                System.out.println();
                while (true) {
                    System.out.println("Patient Menu:");
                    System.out.println("1. Search Doctors");
                    System.out.println("2. View Appointments");
                    System.out.println("3. Book Appointment");
                    System.out.println("4. View Prescription");
                    System.out.println("5. View Refer to Specialist");
                    System.out.println("6. Pay Bills");
                    System.out.println("7. Exit");
                    int choice;

                    try {
                        choice = ss.nextInt();
                        ss.nextLine();

                    } catch (Exception e) {
                        System.out.println("Invalid input! Please enter numbers only (1-7)");
                        ss.nextLine();
                        continue;
                    }
                    switch (choice) {
                        case 1:
                            SearchDoctors();
                            break;
                        case 2:
                            ViewAppointments(patientId);
                            break;
                        case 3:
                            BookAppointment(patientId);
                            break;
                        case 4:
                            ViewPrescription(patientId);
                            break;
                        case 5:
                            ReferToSpecialist(patientId);
                            break;
                        case 6:
                            ShowBill();
                            break;
                        case 7:
                            System.out.println("Exiting...");
                            return;

                        default:
                            System.out.println("Invalid option.");
                    }
                }

            } else {
                System.out.println("Invalid gmail or password. Please try again......!!!!!");
                loginPatient();

            }

        }
    }

    public static void SearchDoctors() throws Exception {

        Class.forName("com.mysql.cj.jdbc.Driver");
        Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/Hospital_management_system", "root",
                "Rishabh@2218");
        System.out.println(
                "Search Doctors by Specialty(e.g Cardiologist,Neurologist,Orthopedic Surgeon,Dermatologist,Ophthalmologist,ENT Specialist):");
        String specialization = ss.nextLine();
        PreparedStatement ps = con.prepareStatement("select * from Doctor where specialization=?");
        ps.setString(1, specialization);
        ResultSet rs = ps.executeQuery();

        boolean found = false;
        while (rs.next()) {
            found = true;
            System.out.println("--------------------------------");
            System.out.println("Doctor ID: " + rs.getInt("Doctor_id")
                    + ",\nName: " + rs.getString("Name")
                    + ",\nContact_no: " + rs.getString("Contact_no")
                    + ",\nEmail: " + rs.getString("email"));
            System.out.println("--------------------------------");
        }

        if (!found) {
            System.out.println("No doctors found with that specialization.");
        }

    }

    static void ViewAppointments(int patient_id) {

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection con = DriverManager.getConnection(
                    "jdbc:mysql://localhost:3306/Hospital_management_system",
                    "root",
                    "Rishabh@2218");

            PreparedStatement ps3 = con.prepareStatement("SELECT * FROM Appointment WHERE patient_id=?");
            ps3.setInt(1, patient_id);
            ResultSet rs3 = ps3.executeQuery();

            if (rs3.isBeforeFirst()) {

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
                System.out.println();
            } else {
                System.out.println("\nYou have no appointments scheduled.......!!!!!!");
            }

            rs3.close();
            con.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    static void BookAppointment(int patientId) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/Hospital_management_system", "root",
                "Rishabh@2218");

        int doctor_id = 0;
        boolean check11 = false;

        while (!check11) {
            try {
                System.out.print("Enter Doctor ID: ");
                doctor_id = ss.nextInt();
                ss.nextLine();
                check11 = true;
            } catch (Exception e) {
                System.out.println("Invalid input! Please enter numbers only.");
                ss.nextLine();
            }
        }

        String appointment_date;
        while (true) {
            System.out.print("Enter Your appointment Date (YYYY/MM/DD): ");
            appointment_date = ss.nextLine().trim();

            if (appointment_date.length() == 10 && appointment_date.charAt(4) == '/'
                    || appointment_date.charAt(4) == '-' && appointment_date.charAt(7) == '/'
                    || appointment_date.charAt(7) == '-') {

                break;
            } else {
                System.out.println("Please enter date in correct format (YYYY/MM/DD).");
            }
        }
        System.out.println("Enter your diagnosis: ");
        String diagnosis = ss.nextLine();

        PreparedStatement check = con.prepareStatement(
                "SELECT * FROM Appointment WHERE patient_id=? AND doctor_id=? AND appointment_date=?");
        check.setInt(1, patientId);
        check.setInt(2, doctor_id);
        check.setString(3, appointment_date);
        ResultSet rs = check.executeQuery();

        if (rs.next()) {
            System.out.println("\nYou already have an appointment with this doctor!");

        } else {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO Appointment(patient_id, doctor_id, appointment_date, diagnosis) VALUES (?, ?, ?, ?)");
            ps.setInt(1, patientId);
            ps.setInt(2, doctor_id);
            ps.setString(3, appointment_date);
            ps.setString(4, diagnosis);
            ps.executeUpdate();

            System.out.println("\nAppointment booked successfully!");
            System.out.println();
        }

        con.close();
    }

    public static void ViewPrescription(int patient_id) {

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/Hospital_management_system",
                    "root",
                    "Rishabh@2218");

            String sql = "SELECT medicine_name, dosage, duration,Quantity, instructions, dispense_date "
                    + "FROM dispensed_medicine "
                    + "WHERE patient_id = ?";

            PreparedStatement pst = con.prepareStatement(sql);
            pst.setInt(1, patient_id);
            ResultSet rs = pst.executeQuery();

            System.out.println("------ Your Prescriptions ------");
            boolean hasPrescription = false;

            while (rs.next()) {
                hasPrescription = true;
                System.out.println("Medicine Name : " + rs.getString("medicine_name"));
                System.out.println("Dosage        : " + rs.getString("dosage"));
                System.out.println("Duration      : " + rs.getString("duration"));
                System.out.println("Quantity      : " + rs.getInt("Quantity"));
                System.out.println("Instructions  : " + rs.getString("instructions"));
                System.out.println("Dispense Date : " + rs.getDate("dispense_date"));
                System.out.println("-----------------------------------");
            }

            if (!hasPrescription) {
                System.out.println("No prescriptions found for you.");
            }

            rs.close();
            pst.close();
            con.close();

        } catch (ClassNotFoundException e) {
            System.out.println("JDBC Driver not found!");
            e.printStackTrace();
        } catch (SQLException e) {
            System.out.println("Database error!");
            e.printStackTrace();
        }
    }

    public static void ReferToSpecialist(int patientId) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/Hospital_management_system", "root",
                "Rishabh@2218");

        System.out.println("Refer to Specialist Details");
        System.out.println("-------------------------------");
        PreparedStatement ps = con.prepareStatement("Select * from refer_patient where patient_id = ?");
        ps.setInt(1, patientId);

        ResultSet rs = ps.executeQuery();
        boolean check = false;
        while (rs.next()) {
            check = true;
            System.out.println("Patient ID: " + rs.getInt("patient_id"));
            System.out.println("From Doctor ID: " + rs.getInt("from_doctor_id"));
            System.out.println("To Doctor ID: " + rs.getInt("to_doctor_id"));
            System.out.println("Reason: " + rs.getString("reason"));
            System.out.println("-------------------------------");

        }
        if (!check) {
            System.out.println("No referral details found for Patient ID: " + patientId);
            System.out.println();
        }

        rs.close();
        ps.close();
        con.close();
    }

    public static void GenerateBill(int patient_id) {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/Hospital_management_system",
                    "root",
                    "Rishabh@2218");

            PreparedStatement ps = con.prepareStatement(
                    "Select pm.patient_id,pm.doctor_id,pm.prescribed_id,d.Fees,Sum(pm.Quantity*m.price_per_unit)as Total_medicine from\n"
                    + //
                    " prescribed_Medicine pm join Doctor d on d.doctor_id=pm.doctor_id \n"
                    + //
                    " join Medicine m on m.medicine_id=pm.Medicine_id where pm.status='Dispensed' AND patient_id=? \n"
                    + //
                    " group by pm.patient_id,pm.doctor_id,pm.prescribed_id;\n"
                    + //
                    "");

            ps.setInt(1, patient_id);
            ResultSet rs = ps.executeQuery();
            int patient_id1 = 0;
            int doctor_Id = 0;
            int prescribed_id = 0;
            double Fees = 0;
            double Total_medicine = 0;
            if (rs.next()) {
                patient_id1 = rs.getInt("pm.patient_id");
                doctor_Id = rs.getInt("pm.doctor_id");
                prescribed_id = rs.getInt("pm.prescribed_id");
                Fees = rs.getDouble("d.Fees");
                Total_medicine = rs.getDouble("Total_medicine");
            }

            PreparedStatement pss = con.prepareStatement(
                    "Insert into bill(patient_id,prescribed_id,doctor_id,total_medicine_cost,doctor_fee) values(?,?,?,?,?)");
            pss.setInt(1, patient_id1);
            pss.setInt(2, prescribed_id);
            pss.setInt(3, doctor_Id);
            pss.setDouble(4, Total_medicine);
            pss.setDouble(5, Fees);
            pss.executeUpdate();

        } catch (Exception e) {
            e.getStackTrace();
        }
    }

    public static void ShowBill() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection con = DriverManager.getConnection(
                    "jdbc:mysql://localhost:3306/Hospital_management_system",
                    "root",
                    "Rishabh@2218");
            Scanner sc = new Scanner(System.in);
            int prescribed_id = 0;
            boolean validPrescribed = false;

            while (!validPrescribed) {
                try {
                    System.out.print("Enter Prescribed ID to view bill: ");
                    prescribed_id = sc.nextInt();
                    sc.nextLine();
                    validPrescribed = true;
                } catch (InputMismatchException e) {
                    System.out.println("Invalid input! Please enter numeric Prescribed ID only.");
                    sc.nextLine();
                }
            }

            String query = "SELECT b.bill_id, p.name AS patient_name, d.name AS doctor_name, "
                    + "b.total_medicine_cost, b.doctor_fee, b.total_amount, b.bill_date, b.payment_status "
                    + "FROM bill b "
                    + "JOIN patient p ON p.patient_id = b.patient_id "
                    + "JOIN doctor d ON d.doctor_id = b.doctor_id "
                    + "WHERE b.prescribed_id = ?";

            PreparedStatement ps = con.prepareStatement(query);
            ps.setInt(1, prescribed_id);
            ResultSet rs = ps.executeQuery();

            boolean recordFound = false;
            List<Integer> billIds = new ArrayList<>();
            String status = " ";
            System.out.println("\n-------------------- BILL DETAILS --------------------\n");
            double billAmount = 0.0;
            while (rs.next()) {
                recordFound = true;
                int billId = rs.getInt("bill_id");
                billIds.add(billId);
                status = rs.getString("payment_status");

                String patientName = rs.getString("patient_name");
                String doctorName = rs.getString("doctor_name");
                double medCost = rs.getDouble("total_medicine_cost");
                double docFee = rs.getDouble("doctor_fee");
                double totalAmt = rs.getDouble("total_amount");
                String billDate = rs.getString("bill_date");
                String paymentStatus = rs.getString("payment_status");
                billAmount = rs.getDouble("total_amount");

                System.out.println("Bill ID          : " + billId);
                System.out.println("Patient Name     : " + patientName);
                System.out.println("Doctor Name      : " + doctorName);
                System.out.println("Bill Date        : " + billDate);
                System.out.println("-----------------------------------------------------");
                System.out.println("Total Medicine Cost : $" + medCost);
                System.out.println("Doctor Fee          : $" + docFee);
                System.out.println("-----------------------------------------------------");
                System.out.println("Total Amount        : $" + totalAmt);
                System.out.println("Payment Status      : " + paymentStatus);
                System.out.println("-----------------------------------------------------\n");
            }

            if (!recordFound) {
                System.out.println("No bill found for Prescribed ID: ");
                System.out.println();
                con.close();
                return;
            }

            int selectedBillId = 0;
            boolean valid2 = false;

            while (!valid2) {
                try {
                    System.out.print("Enter Bill ID you want to pay: ");
                    selectedBillId = ss.nextInt();
                    valid2 = true;
                } catch (InputMismatchException e) {
                    System.out.println("Invalid input! Please enter numeric ID only.");
                    ss.nextLine();
                }
            }

            if (!billIds.contains(selectedBillId)) {
                System.out.println("Invalid Bill ID! Payment cancelled.");
                con.close();
                return;
            } else if (!status.equalsIgnoreCase("Pending")) {
                System.out.println("Your Bill is already paid ......");
                return;
            }

            System.out.println("---->>>> Select Payment Mode <<<<-----");

            int choice = 0;
            boolean validChoice = false;

            while (!validChoice) {

                System.out.println("1. By Cash");
                System.out.println("2. By UPI");
                System.out.println("3. By Card");
                System.out.print("Enter your choice: ");

                try {
                    choice = sc.nextInt();
                    sc.nextLine();
                    if (choice >= 1 && choice <= 3) {
                        validChoice = true;
                    } else {
                        System.out.println("Invalid choice! Please enter a number between 1 to 3.\n");
                    }
                } catch (Exception e) {
                    System.out.println("Invalid input! Please enter numbers only (1-3).\n");
                    sc.nextLine();
                }
            }

            String paymentMode = "";
            switch (choice) {
                case 1:
                    paymentMode = "Cash";
                    break;
                case 2:
                    paymentMode = "UPI";
                    break;
                case 3:
                    paymentMode = "Card";
                    break;
            }

            double enteredAmount = 0.0;
            boolean validAmount = false;

            while (!validAmount) {
                System.out.print("\nEnter amount to pay (Bill Amount $" + billAmount + "): ");
                try {
                    enteredAmount = sc.nextDouble();
                    sc.nextLine();

                    if (enteredAmount == billAmount) {
                        validAmount = true;
                    } else if (enteredAmount < billAmount) {
                        System.out.println("Entered amount is less than bill amount! Please enter correct amount.");
                    } else {
                        System.out.println("Entered amount is more than bill amount! Please enter correct amount.");
                    }
                } catch (Exception e) {
                    System.out.println("Invalid input! Please enter a valid number.");
                    sc.nextLine();
                }
            }

            String updateQuery = "UPDATE bill SET payment_status = 'Paid', payment_mode = ? WHERE bill_id = ?";
            PreparedStatement updatePs = con.prepareStatement(updateQuery);
            updatePs.setString(1, paymentMode);
            updatePs.setInt(2, selectedBillId);

            int rows = updatePs.executeUpdate();

            if (rows > 0) {
                System.out.println("\nPayment of $" + billAmount + " done successfully by " + paymentMode + "!");
            } else {
                System.out.println("Failed to update bill status!");
            }

            updatePs.close();

            ps.close();
            rs.close();
            con.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void patientMenu() throws Exception {
        while (true) {
            System.out.println("\n1. Registration");
            System.out.println("2. Login");
            System.out.println("3. Exit");

            System.out.print("Enter your choice: ");
            String input = ss.nextLine();
            int choice;

            try {
                choice = Integer.parseInt(input);
            } catch (NumberFormatException e) {
                System.out.println("Invalid input! Please enter numbers only (1-3)");
                continue;
            }

            switch (choice) {
                case 1:
                    registeredPatient();
                    break;

                case 2:
                    loginPatient();
                    break;

                case 3:
                    System.out.println("Exiting....");
                    return;
                default:
                    System.out.println("Invalid choice! Please enter a number between 1 and 3.");
            }
        }
    }

    public static void main(String[] args) throws Exception {
        Patient.patientMenu();

    }
}
