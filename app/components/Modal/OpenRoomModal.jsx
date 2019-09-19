import React from "react";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import counterpart from "counterpart";
import AssetActions from "actions/AssetActions";
import AccountSelector from "../Account/AccountSelector";
import AmountSelector from "../Utility/AmountSelector";
import SeerActions from "../../actions/SeerActions";
var Apis =  require("seerjs-ws").Apis;

class OpenRoomModal extends React.Component {

    static propTypes = {
        room:React.PropTypes.object.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            start: new Date(),
            stop: new Date(),
            startv: "",
            stopv: "",
            account: {},
            room: {},
            input_duration_secs: 60
        };
    }

    componentWillReceiveProps(next) {
        // if (this.props.account) {
        //     Apis.instance().db_api().exec("get_account_by_name", [this.props.account]).then(r => {
        //         this.setState({account: r});
        //     });
        // }

        // if (!this.props.room) {
        //     return;
        // }
        // Apis.instance().db_api().exec("get_seer_room", [this.props.room, 0, 100]).then(r => {
        //     this.setState({room: r});
        //     let objs = [];
        //     for (var i in r.room_lmsr.selection_description) {
        //         let obj = {
        //             label: r.room_lmsr.selection_description[i],
        //             checked: false
        //         };
        //         objs.push(obj);
        //     }
        // });
    }

    componentWillMount() {

    }

    onSubmit() {
        var args = {
            issuer: this.props.account.get("id"),
            room: this.props.room.id,
            start: this.state.start,
            stop:  this.state.stop,
            input_duration_secs: parseInt(this.state.input_duration_secs*60)
        };
        console.log(args);
        SeerActions.openRoom(args);
    }


    render() {
        let tabIndex = 1;

        Date.prototype.toDateInputValue = (function() {
            var local = new Date(this);
            local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
            return local.toJSON().slice(0,19);
        });

        return ( <form className="grid-block vertical full-width-content">
            <div className="grid-container " style={{paddingTop: "2rem"}}>
                <Translate component="h4" content="seer.room.open_room" style={{textAlign:"center",fontWeight:"bold"}}/>
                <br/><br/>
                <label>
                    <label>
                        <Translate content="account.votes.start" />
                        <input value={this.state.start.toDateInputValue()} step={1}  onChange={(e) => {this.setState({start: new Date(e.target.value)});}} type="datetime-local"></input>
                    </label>
                </label>
                <label>
                    <label>
                        <Translate content="account.votes.end" />
                        <input value={this.state.stop.toDateInputValue()} step={1}  onChange={(e) => {this.setState({stop: new Date(e.target.value)});}} type="datetime-local"></input>
                    </label>
                </label>

                <label>
                    <label>
                        <Translate content="seer.room.input_duration_secs" />
                        <input value={this.state.input_duration_secs} onChange={(e) => {this.setState({input_duration_secs: e.target.value});}} type="text"/>
                    </label>
                </label>
                <br/><br/>
                <div className="content-block button-group">
                    <button className="button outline" onClick={this.props.onClose} tabIndex={tabIndex++}>
                        <Translate content="cancel" />
                    </button>
                    <button className="button" onClick={this.onSubmit.bind(this, this.state.checks)} tabIndex={tabIndex++}>
                      <Translate content="seer.room.open" />
                    </button>
                </div>
            </div>
        </form> );
    }
}

export default (OpenRoomModal);
