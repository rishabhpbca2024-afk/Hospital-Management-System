import java.sql.*;
import java.util.Scanner;

class Login_Page {
    public static void main(String[] args) throws Exception {
        Scanner ss = new Scanner(System.in);

        Class.forName("com.mysql.cj.jdbc.Driver");

        Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/Detail", "root", "Rishabh@2218");

        while (true) {
            System.out.println("\n----->>> USER MANAGEMENT SYSTEM <<<------");
            System.out.println("1.Sign Up");
            System.out.println("2.Login");
            System.out.println("3.Exit");
            System.out.print("Enter your choice: ");
            int choice = ss.nextInt();
            ss.nextLine();
            if (choice == 1) {

                System.out.println("\n----->>>>>> Sign Up Page <<<<<-------");
                System.out.print("Enter Your Name : ");
                String name = ss.nextLine();
                System.out.print("Enter Your Gmail : ");
                String gmail = ss.nextLine();
                System.out.print("Enter the Password : ");
                String password = ss.nextLine();
                System.out.print("Re-Enter the Password : ");
                String password2 = ss.nextLine();

                if (password.equals(password2)) {

                    PreparedStatement ps = con
                            .prepareStatement("INSERT INTO User_Detail(Name, Gmail, Password) VALUES (?, ?, ?)");
                    ps.setString(1, name);
                    ps.setString(2, gmail);
                    ps.setString(3, password);
                    ps.executeUpdate();
                    System.out.println("Sign Up Successfully!");
                    ps.close();
                }

                else {
                    System.out.println("Passwords do not match!");
                }

            } else if (choice == 2) {

                System.out.println("\n----->>>>>> Login Page <<<<<-------");

                System.out.print("Enter Your Gmail : ");
                String gmail = ss.nextLine();
                System.out.print("Enter Your Password : ");
                String password = ss.nextLine();

                PreparedStatement ps = con.prepareStatement("SELECT * FROM User_Detail WHERE Gmail=? AND Password=?");
                ps.setString(1, gmail);
                ps.setString(2, password);

                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    System.out.println("Login Successful! Welcome, " + rs.getString("Name"));
                } else {
                    System.out.println("Invalid Gmail or Password!");
                }
                rs.close();
                ps.close();

            } else if (choice == 3) {
                System.out.println("\n Thank you,Exiting...");
                break;
            } else {
                System.out.println("Invalid choice! Please enter 1, 2 or 3.");
            }
        }

        con.close();
        ss.close();
    }
}
