
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.util.Scanner;

public class Sign_In_Page {
    public static void main(String[] args) throws Exception {
        Scanner ss = new Scanner(System.in);
        System.out.println("----->>>>>> Sign In Page <<<<<-------");
        System.out.print("Enter Your Name : ");
        String name = ss.nextLine();
        System.out.print("Enter Your Gmail :");
        String Gmail = ss.nextLine();
        System.out.print("Enter the Password :");
        String Password = ss.nextLine();
        System.out.print("Re-Enter the Password :");
        String Password2 = ss.nextLine();

        Class.forName("com.mysql.cj.jdbc.Driver");
        if (Password.equals(Password2)) {

            Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/Detail", "root", "Rishabh@2218");

            PreparedStatement ps = con.prepareStatement("insert into User_Detail values(?,?,?)");
            ps.setString(1, name);
            ps.setString(2, Gmail);
            ps.setString(3, Password);
            ps.executeUpdate();

            con.close();

            System.out.println("Sign In Successfully");

        } else {
            System.out.println("Password Not Match");
        }

    }
}
