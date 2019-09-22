import alt from "alt-instance";
import BrowserNotificationActions from "actions/BrowserNotificationActions";
import BaseStore from "./BaseStore";

class BrowserNotificationStore extends BaseStore {

    constructor() {
        super();

        this.bindListeners({
          addNotification : BrowserNotificationActions.addNotification
        });

        this._export(
            "reset"
        );

        this.state = {
            notification: null
        }
    }
    
    addNotification(notification) {
        this.setState({ notification: notification })
    }

    reset(){
        this.state.notification = null;
    }
}

export default alt.createStore(BrowserNotificationStore, 'BrowserNotificationStore')
