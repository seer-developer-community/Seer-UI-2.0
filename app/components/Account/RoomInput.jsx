import React from "react";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import SeerActions from "../../actions/SeerActions";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from '../Modal/BaseModal';
import RoomCard from "./RoomCard";

class RoomInput extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount,
        room: React.PropTypes.object,
        onBack:React.PropTypes.func
    };

    constructor(props) {
        super(props);

        this.state = {
            room: props.room,
            input: 0
        };
    }

    onSubmit = () => {
        this.onModalClose();
        let args = {
            issuer: this.props.account.get("id"),
            room: this.state.room.id,
            input: [this.state.input]
        };
        SeerActions.inputRoom(args);
    }

    onModalShow() {
        ZfApi.publish('roomInputModal', "open");
    }
    onModalClose() {
        ZfApi.publish('roomInputModal', "close");
        ZfApi.unsubscribe("transaction_confirm_actions");
    }

      onBack(){
        if(this.props.onBack){
          this.props.onBack();
        }
      }

    render() {
        return (
          <div className="grid-block vertical full-width-content">
            <Modal
                id='roomInputModal'
                overlay={true}
                onClose={this.onModalCancel}
                noCloseBtn>
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
            <div className="grid-container " style={{paddingTop: "2rem",marginLeft:0}}>
              <Translate component="div" content="seer.room.input" style={{color:"#666",fontSize:14,fontWeight:"bold",margin:"0 0 28px 0"}}/>

              <RoomCard room={this.state.room} checkMode={true} showDetail={true} showGiveUpOption={true} checkedItem={this.state.input}
                        onOptionCheck={i=>this.setState({input:i})}>
                <div style={{display:"flex",justifyContent:"flex-end",padding:"86px 31px 40px 0"}}>
                    <button className="button large outline" style={{width:220,height:54}} onClick={this.onBack.bind(this)}><Translate content="transfer.back"/></button>
                    <button className="button large" style={{width:220,height:54}} onClick={this.onModalShow}><Translate content="seer.room.submit_result"/></button>
                </div>
              </RoomCard>
            </div>
        </div> );
    }
}

export default BindToChainState(RoomInput);
