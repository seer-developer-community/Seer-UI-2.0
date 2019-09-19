import notify from "../../actions/NotificationActions";
import counterpart from "counterpart";

const dismissSec = 3;

const msg = (type,msgKey,option) => {
  notify.addNotification({
    message: counterpart.translate(msgKey, option),
    level: type,
    autoDismiss: dismissSec,
    position: "tr"
  });
};

const error = (msgKey,option) => {
  msg("error",msgKey,option);
};

const success = (msgKey,option) => {
  msg("success",msgKey,option);
};

export default {
  error,success
}