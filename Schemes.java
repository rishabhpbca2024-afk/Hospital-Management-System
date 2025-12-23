import java.util.Scanner;
import java.sql.*;
class Schemes{
    static Scanner sc=new Scanner(System.in);
    public static void main(String[] args) {
        
    }
    static void addScheme(ResultSet rs){
            System.out.print("Enter new scheme name:");
            boolean flag=true;
            while (flag){
                String name=sc.nextLine();
                try{
                    if(rs.next()){
                        if(name.equals(rs.getString("Scheme_name"))){
                            System.out.print("Scheme already exists enter a new name:");
                        }else{
                            flag=false;
                        }
                    }else{
                        flag=false;
                    }
                }catch(Exception e){
                    System.out.println(e);
                }
            }


  

  



    }
    
}