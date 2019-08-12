import React from "react";
import Translate from "react-translate-component";
import PubKeyInput from "../Forms/PubKeyInput";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {Tabs, Tab} from "../Utility/Tabs";
import counterpart from "counterpart";
import SignedMessageAction from "../../actions/SignedMessageAction";
import SignedMessage from "../Account/SignedMessage";

/** This component gives a user interface for signing and verifying messages with the bitShares memo key.
 *  It consists of two tabs:
 *    - Sign message tab (code prefix: tabSM)
 *    - Verify message tab (code prefix: tabVM)
 *
 *  See SignedMessageAction for details on message format.
 *
 *    @author Stefan Schiessl <stefan.schiessl@blockchainprojectsbv.com>
 */
class AccountSignedMessages extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
    };

    constructor(props) {
        super(props);
        // initialize state (do not use setState method!)
        this.state = {
            tabsm_memo_key: this.props.account.get("options").get("memo_key"),
            tabsm_popup: "",
            tabsm_message_text: null,
            tabsm_message_signed: null,
            tabvm_popup: "",
            tabvm_message_signed: null,
            tabvm_verified: null,
            tabvm_message_signed_and_verified: null,
            tabvm_flag_verifyonchange: false
        };
    }



    /**
     * Event when user pushes sign button. Memo message and meta will be signed and displayed
     * in the bottom textarea
     *
     * @param event
     */
    _tabSMSignAction(event) {
        event.preventDefault();

        try {
            // validate keys are still the same. Better: make public memokey field uneditable
            let storedKey = this.props.account.get("options").get("memo_key");
            if (this.state.tabsm_memo_key !== storedKey) {
                throw Error(counterpart.translate("account.signedmessages.keymismatch"));
            }

            // there should be a message entered
            if (this.state.tabsm_message_text) {
                this._tabSMPopMessage(counterpart.translate("account.signedmessages.signing"), 0);
                SignedMessageAction.signMessage(this.props.account, this.state.tabsm_message_text).then((res) => {
                    this.setState({
                        tabsm_message_signed: res,
                        tabsm_popup: "" // clear loading message
                    });
                }).catch((err) => {
                    this._tabSMPopMessage(err.message);
                    this.setState({
                        tabsm_message_signed: null
                    });
                });
            }
        } catch (err) {
            this._tabSMPopMessage(err.message);
            this.setState({
                tabsm_message_signed: null
            });
        }
    }

    _tabSMHandleChange(event) { // event for textarea
        this.setState({tabsm_message_text: event.target.value});
    }

    _tabSMHandleChangeKey(value) { // event for textfield of public key
        this.setState({tabsm_memo_key: value});
    }

    _tabSMCopyToClipBoard(event) { // event when user clicks into the signed message textarea
        if (event.target.value !== "") {
            event.target.focus();
            event.target.select();

            try {
                var successful = document.execCommand("copy");
                this._tabSMPopMessage(successful ? counterpart.translate("account.signedmessages.copysuccessful") :
                    counterpart.translate("account.signedmessages.copyunsuccessful"));
            } catch (err) {
                this._tabSMPopMessage(counterpart.translate("account.signedmessages.copyunsuccessful"));
            }
        }
    }

    /**
     * Displays an information to the user that disappears over time
     *
     * @param message
     * @param timeout
     */
    _tabSMPopMessage(message, timeout=3000) {
        this.setState({
            tabsm_popup: message
        });

        if (message !== "" && timeout > 0) {
            setTimeout(
                () => {
                    this.setState({
                        tabsm_popup: ""
                    });
                }, timeout);
        }
    }

    /**
     * Event when the user tries to verify a message, either manual through the button or onChange of the textarea.
     * The message is parsed and verified, the user gets the message restated in the bottom part of the site
     *
     * @param event
     */
    _tabVMAction(event) {
        event.preventDefault();

        // reset to unverified state
        this.setState({
            tabvm_message_signed_and_verified: null,
            tabvm_verified: false,
        });

        // attempt verifying
        if(this.state.tabvm_message_signed) {
            this._tabVMPopMessage(counterpart.translate("account.signedmessages.verifying"), 0);

            setTimeout(() => { // do not block gui
                try {
                    let message_signed_and_verified = SignedMessageAction.verifyMemo(this.state.tabvm_message_signed);
                    this.setState({
                        tabvm_message_signed_and_verified: message_signed_and_verified,
                        tabvm_verified: true,
                        tabvm_popup: "" // clear verifying message
                    });
                } catch (err) {
                    this._tabVMPopMessage(err.message);
                    this.setState({
                        tabvm_message_signed_and_verified: null,
                        tabvm_verified: false
                    });
                }
            }, 0);
        }

    }

    _tabVMHandleChange(event) { // onchange event of the input textarea
        this.setState({
            tabvm_message_signed: event.target.value,
            tabvm_verified: false,
            tabvm_message_signed_and_verified: null,
        });
        if (this.state.tabvm_flag_verifyonchange) {
            this._tabVMAction(event);
        }
    }

    /**
     * Displays an information to the user that disappears over time
     *
     * @param message
     * @param timeout
     */
    _tabVMPopMessage(message, timeout=3000) {
        this.setState({
            tabvm_popup: message
        });

        if (message !== "" && timeout > 0) {
            setTimeout(
                () => {
                    this.setState({
                        tabvm_popup: ""
                    });
                }, timeout);
        }
    }

    _tabVMToggleVerifyOnChange() { // event when the user enables / disables verifying while typing
        this.setState({
            tabvm_flag_verifyonchange: !this.state.tabvm_flag_verifyonchange
        });
    }

    render() {
        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className="content-block small-12">
                    <div className="tabs-container generic-bordered-box">
                        <Tabs
                            className="account-tabs"
                            tabsClass="account-overview no-padding bordered-header content-block"
                            setting="accountSignedMessagesTab"
                            contentClass="shrink small-vertical medium-horizontal"
                            segmented={false}
                        >

                            <Tab title="account.signedmessages.signmessage">
                                <div style={{paddingTop:"34px"}}>

                                    <PubKeyInput
                                        ref="memo_key"
                                        value={this.state.tabsm_memo_key}
                                        label="account.perm.memo_public_key"
                                        placeholder={counterpart.translate("account.perm.input_public_key")}
                                        tabIndex={7}
                                        onChange={this._tabSMHandleChangeKey.bind(this)}
                                        disableActionButton={true}
                                        hiddenIcon={true}
                                    />
                                    <br/>
                                    <textarea className="w600" style={{height:120}} rows="10" value={this.state.tabsm_message_text} onChange={this._tabSMHandleChange.bind(this)} placeholder={counterpart.translate("account.signedmessages.entermessage")} />
                                    <br/>
                                    <span>
                                        <button className="button large" onClick={this._tabSMSignAction.bind(this)}>
                                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                            <Translate content="account.signedmessages.sign"/>
                                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                        </button>
                                        <text style={{color: "gray"}}>{this.state.tabsm_popup}</text>
                                    </span>
                                    <br/>
                                    <br/>
                                    <br/>
                                    <textarea className="w600"
                                              rows="14"
                                              readOnly={true}
                                              value={this.state.tabsm_message_signed}
                                              style={{height:120}}
                                              placeholder={counterpart.translate("account.signedmessages.automaticcreation")}
                                              onClick={this._tabSMCopyToClipBoard.bind(this)}  />
                                </div>
                            </Tab>

                            <Tab title="account.signedmessages.verifymessage">
                                <div style={{paddingTop:"34px"}}>
                                    <div className="flex-align-middle align-right label-text">
                                      <Translate content="account.signedmessages.verifyonchange"/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                      <div className="switch" onClick={this._tabVMToggleVerifyOnChange.bind(this)}>
                                        <input type="checkbox" checked={this.state.tabvm_flag_verifyonchange} value={counterpart.translate("account.signedmessages.verifyonchange")} />
                                        <label />
                                      </div>
                                    </div>
                                    <textarea style={{height:120}} rows="10" value={this.state.tabvm_message_signed} onChange={this._tabVMHandleChange.bind(this)} placeholder={counterpart.translate("account.signedmessages.entermessage")} />
                                  {this.state.tabvm_verified !== null &&
                                  <div style={{color:"red"}}>
                                    Message is:
                                    <span
                                      style={{color: this.state.tabvm_verified ? "green" : "red"}}>
                                      {this.state.tabvm_verified ? "VERIFIED" : "NOT VERIFIED"}
                                    </span>
                                    <br/>
                                    <br/>
                                  </div>
                                  }
                                  <br/>
                                  <span>
                                        <button className="button large" onClick={this._tabVMAction.bind(this)}>
                                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                            <Translate content="account.signedmessages.verify"/>
                                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                        </button>
                                        <text style={{color: "gray"}}>{this.state.tabvm_popup}</text>
                                        {((this.state.tabvm_verified && this.state.tabvm_message_signed_and_verified !== null) || this.state.tabvm_flag_verifyonchange) &&
                                        <div>
                                            <br />
                                            <SignedMessage message={this.state.tabvm_message_signed}/>
                                        </div>
                                        }
                                    </span>
                                </div>
                            </Tab>

                        </Tabs>
                    </div>
                </div>
            </div>
        );
    }
}
AccountSignedMessages = BindToChainState(AccountSignedMessages);

export default AccountSignedMessages;
