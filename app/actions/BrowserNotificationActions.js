import alt from "alt-instance";

class BrowserNotificationActions {

  /**
   * @param notification.title
   * @param notification.body
   * @param notification.closeOnClick
   * @returns {*}
   */
    addNotification(notification) {
        return notification;
    }
}

export default alt.createActions(BrowserNotificationActions);