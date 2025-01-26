import { Router } from "express";
import { registerUser,
    loginUser,
    logoutUser,refreshAccessToken
     } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser);

    router.route("/login").post(loginUser);
    router.route("/logout").post(verifyJWT, logoutUser);
    router.route("refreshtoken").post(refreshAccessToken);
    router.route("/changepassword").post(verifyJWT,changeCurrentPaswword);
    router.route("/currentuser").get(verifyJWT,getCurrentUser);
    router.route("/updateaccount").patch(verifyJWT,updateAccountDetails)
    router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)
    router.route("/coverimage").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)
    router.route("/c/:username".get(verifyJWT,getUserChannelProfile))
    router.route("/history").get(verifyJWT,getWatchHistory)

export default router;


