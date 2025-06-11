import { auth } from "../firebase";

const storeFirebaseToken = async () => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    localStorage.setItem("firebaseToken", JSON.stringify({
      token,
      expiry: Date.now() + 18 * 24 * 60 * 60 * 1000 // 18 days
    }));
  }
};
export default storeFirebaseToken;
