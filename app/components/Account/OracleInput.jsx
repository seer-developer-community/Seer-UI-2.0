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
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from '../Modal/BaseModal';
var Apis =  require("seerjs-ws").Apis;

class OracleInput extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount
    };

    static defaultProps = {
        // room: "props.params.room_id"
    }

    constructor(props) {
        super(props);
        this.state = {
            room: {},
            input: 0,
            oracle: null,
        };
    }

    componentWillReceiveProps(next) {

    }

    componentWillMount() {
        Apis.instance().db_api().exec("get_seer_room", [this.props.params.room_id, 0, 100]).then(r => {
            this.setState({room: r});
        });
        Apis.instance().db_api().exec("get_oracle_by_account", [this.props.account.get("id")]).then(r => {
            this.setState({oracle: r});
        });
    }

    onSubmit = () => {
        this.onModalClose();
        let args = {
            issuer: this.props.account.get("id"),
            oracle: this.state.oracle.id,
            room: this.state.room.id,
            input: [this.state.input]
        };
        SeerActions.inputOracle(args);
    }
    onModalShow() {
        ZfApi.publish('oracleInputModal', "open");
    }
    onModalClose() {
        ZfApi.publish('oracleInputModal', "close");
        ZfApi.unsubscribe("transaction_confirm_actions");
    }
    handleInputChange(idx) {
        this.setState({input: idx});
    }

    render() {
        let tabIndex = 1;
        let options = [];
        if (this.state.room.running_option) {
            let idx = 0;
            options = this.state.room.running_option.selection_description.map(c => {
                let dom = (
                    <label key={idx}>
                        <input type="radio" name="radio" value={idx} checked={this.state.input == idx} onChange={this.handleInputChange.bind(this, idx)}/> {c}
                    </label>
                );

                idx++;
                return dom;
            });
        }
        options.push(
            <label key={255}>
                <input type="radio" name="radio" value={255} checked={this.state.input == 255} onChange={this.handleInputChange.bind(this, 255)}/> <Translate content="seer.room.abandon"/>
            </label>
        );
        return ( <div className="grid-block vertical full-width-content">
            <Modal
                id='oracleInputModal'
                overlay={true}
                onClose={this.onModalCancel}
                noCloseBtn
            >
                <div style={{ margin: '12px' }}>
                    <Translate content="seer.room.confirm"/>
                    <span style={{textTransform: 'uppercase'}}>
                        &nbsp;
                        {
                            this.state.input === 255
                            ? <Translate content="seer.room.abandon"/>
                            : this.state.room.running_option
                                ? this.state.room.running_option.selection_description[this.state.input]
                                : null
                        }
                        &nbsp;
                    </span>
                    ?
                </div>
                <div style={{ float: 'right' }}>
                    <button className='button' type="submit" value="Submit" onClick={this.onSubmit}>
                        <Translate component="span" content="transfer.confirm" />
                    </button>
                    <button className='button' type="submit" value="Submit" onClick={this.onModalClose}>
                        <Translate component="span" content="transfer.cancel" />
                    </button>
                </div>
            </Modal>
            <div className="grid-container " style={{paddingTop: "2rem"}}>
                <h3><Translate content="seer.oracle.input"/></h3>
                <div className="content-block">
                    {options}
                </div>

                <div className="content-block button-group">
                    <div style={this.state.oracle ? {} : { width: '100%', height: '100%', position: 'absolute'}}></div>
                    <button
                        className="button"
                        style={this.state.oracle ? {} : { background: '#e5e6e4', color: '#333' }}
                        onClick={this.onModalShow}
                    >
                        <Translate content="seer.oracle.input"/>
                    </button>
                </div>
            </div>
        </div> );
    }
}

export default BindToChainState(OracleInput);
