import React from "react";
import classnames from "classnames";
import Translate from "react-translate-component";
import PrivateKeyView from "components/PrivateKeyView";
import {PublicKey} from "seerjs/es";
import Icon from "../Icon/Icon";
import PrivateKeyStore from "stores/PrivateKeyStore";

/**
 * @brief Allows the user to enter a public key
 */

class PubKeyInput extends React.Component {

    static propTypes = {
        label: React.PropTypes.string.isRequired, // a translation key for the label
        value: React.PropTypes.string, // current value
        error: React.PropTypes.string, // the error message override
        placeholder: React.PropTypes.string, // the placeholder text to be displayed when there is no user_input
        onChange: React.PropTypes.func, // a method to be called any time user input changes
        onAction: React.PropTypes.func, // a method called when Add button is clicked
        tabIndex: React.PropTypes.number, // tabindex property to be passed to input tag
        disableActionButton: React.PropTypes.bool, // use it if you need to disable action button
        hiddenIcon: React.PropTypes.bool
    }

    constructor(props) {
        super(props);
    }

    isValidPubKey(value) {
        return !!PublicKey.fromPublicKeyString(value);
    }

    onInputChanged(event) {
        let value = event.target.value.trim();
        this.props.onChange(value);
    }

    onKeyDown(event) {
        if (event.keyCode === 13) this.onAction(event);
    }

    onAction(event) {
        event.preventDefault();
        if(this.props.onAction && this.state.valid && !this.props.disableActionButton) {
            this.props.onAction(event);
        }
    }

    render() {
        let error = this.props.error;
        if (!error && this.props.value && !this.isValidPubKey(this.props.value)) error = "Not a valid public key";
        let action_class = classnames("button", {"disabled" : error || this.props.disableActionButton});
        const keys = PrivateKeyStore.getState().keys;
        const has_private = this.isValidPubKey(this.props.value) && keys.has(this.props.value);

        return (
            <div className="pubkey-input no-overflow">
                <div className="content-area">
                    <div className="header-area" style={this.props.hiddenIcon ? {marginLeft:0}:{}}>
                        <Translate className="left-label" component="label" content={this.props.label}/>
                    </div>
                    <div className="input-area">
                        <span className="inline-label">
                          { this.props.hiddenIcon ? null :
                            <div className="account-image">
                                <PrivateKeyView pubkey={this.props.value}>
                                    <Icon name="key" size="4x"/>
                                </PrivateKeyView>
                            </div>
                          }
                        <input type="text"
                            className={"w600 " + ( has_private ? "my-key" : "")}
                            value={this.props.value}
                            placeholder={this.props.placeholder || counterpart.translate("account.public_key")}
                            ref="user_input"
                            onChange={this.onInputChanged.bind(this)}
                            onKeyDown={this.onKeyDown.bind(this)}
                            tabIndex={this.props.tabIndex}
                        />
                        { this.props.onAction ? (
                            <button className={action_class}
                                onClick={this.onAction.bind(this)}>
                                <Translate content={this.props.action_label}/>
                            </button>
                        ) : null }
                        </span>
                    </div>

                    {!error && this.props.value && this.isValidPubKey(this.props.value) ?
                      <div className="flex-align-middle" style={{marginTop:10}}>
                        <svg className="icon" aria-hidden="true" style={{width:24,height:24}}>
                          <use xlinkHref="#icon-xuanzhong"></use>
                        </svg>
                        <Translate content="account.perm.valid_pub"  style={{fontSize:14,color:"#57C692",marginLeft:5}}/>
                      </div> : null}
                    <div className="error-area has-error">
                        <span>{error}</span>
                    </div>
                </div>
            </div>
        );
    }

}
export default PubKeyInput;
