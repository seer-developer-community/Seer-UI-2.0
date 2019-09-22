import React from "react";
import {Link} from "react-router/es";
import BindToChainState from "./BindToChainState";

class LinkToRoomById extends React.Component {
    static propTypes = {
        room: React.PropTypes.string.isRequired,
    }

    render() {
        let {room} = this.props;
        return this.props.noLink ? room : <Link to={`/prediction/rooms/${room}`}>{room}</Link>;
    }
}

export default BindToChainState(LinkToRoomById);
