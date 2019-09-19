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

class StopParticipateModal extends React.Component {

    static propTypes = {
    };

    constructor(props) {
        super(props);
        this.state = {
            input_duration_secs: 0
        };
    }

    componentWillReceiveProps(next) {
        if (next.room) {
            this.setState({input_duration_secs: next.room.option.input_duration_secs/60});
        }
    }

    componentWillMount() {

    }

    onSubmit() {
        var args = {
            issuer: this.props.account.get("id"),
            room: this.props.room.id,
            input_duration_secs: parseInt(this.state.input_duration_secs*60)
        };
        console.log(args);
        SeerActions.stopParticipate(args);
    }


    render() {
        let tabIndex = 1;

        return ( <form className="grid-block vertical full-width-content">
            <div className="grid-container " style={{paddingTop: "2rem"}}>
                  <Translate component="h4" content="seer.room.stop_participate" style={{textAlign:"center",fontWeight:"bold"}}/>
                  <br/><br/>
                <label>
                    <label>
                        <Translate content="seer.room.input_duration_secs" />
                        <input value={this.state.input_duration_secs} onChange={(e) => {this.setState({input_duration_secs: e.target.value});}} type="text"/>
                    </label>
                </label>
                <br/><br/>
                <div className="content-block button-group">
                  <button className="button outline" onClick={this.props.onClose} tabIndex={tabIndex++}><Translate content="cancel" /></button>
                  <button className="button success" onClick={this.onSubmit.bind(this, this.state.checks)} tabIndex={tabIndex++}>
                      <Translate content="seer.room.stop_participate" />
                  </button>
                </div>
            </div>
        </form> );
    }
}

export default (StopParticipateModal);
