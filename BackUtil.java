public class BackUtil {

    public static boolean isBack(String input) {
        if (input != null && input.trim().equalsIgnoreCase("back")) {
            System.out.println("Going back...");
            return true;
        }
        return false;
    }
}
