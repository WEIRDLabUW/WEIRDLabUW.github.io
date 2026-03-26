/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const omnireset = $root.omnireset = (() => {

    /**
     * Namespace omnireset.
     * @exports omnireset
     * @namespace
     */
    const omnireset = {};

    omnireset.PlayRequest = (function() {

        /**
         * Properties of a PlayRequest.
         * @memberof omnireset
         * @interface IPlayRequest
         * @property {string|null} [task] PlayRequest task
         */

        /**
         * Constructs a new PlayRequest.
         * @memberof omnireset
         * @classdesc Represents a PlayRequest.
         * @implements IPlayRequest
         * @constructor
         * @param {omnireset.IPlayRequest=} [properties] Properties to set
         */
        function PlayRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PlayRequest task.
         * @member {string} task
         * @memberof omnireset.PlayRequest
         * @instance
         */
        PlayRequest.prototype.task = "";

        /**
         * Creates a new PlayRequest instance using the specified properties.
         * @function create
         * @memberof omnireset.PlayRequest
         * @static
         * @param {omnireset.IPlayRequest=} [properties] Properties to set
         * @returns {omnireset.PlayRequest} PlayRequest instance
         */
        PlayRequest.create = function create(properties) {
            return new PlayRequest(properties);
        };

        /**
         * Encodes the specified PlayRequest message. Does not implicitly {@link omnireset.PlayRequest.verify|verify} messages.
         * @function encode
         * @memberof omnireset.PlayRequest
         * @static
         * @param {omnireset.IPlayRequest} message PlayRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PlayRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.task != null && Object.hasOwnProperty.call(message, "task"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.task);
            return writer;
        };

        /**
         * Encodes the specified PlayRequest message, length delimited. Does not implicitly {@link omnireset.PlayRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof omnireset.PlayRequest
         * @static
         * @param {omnireset.IPlayRequest} message PlayRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PlayRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PlayRequest message from the specified reader or buffer.
         * @function decode
         * @memberof omnireset.PlayRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {omnireset.PlayRequest} PlayRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PlayRequest.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.omnireset.PlayRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.task = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PlayRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof omnireset.PlayRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {omnireset.PlayRequest} PlayRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PlayRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PlayRequest message.
         * @function verify
         * @memberof omnireset.PlayRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PlayRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.task != null && message.hasOwnProperty("task"))
                if (!$util.isString(message.task))
                    return "task: string expected";
            return null;
        };

        /**
         * Creates a PlayRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof omnireset.PlayRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {omnireset.PlayRequest} PlayRequest
         */
        PlayRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.omnireset.PlayRequest)
                return object;
            let message = new $root.omnireset.PlayRequest();
            if (object.task != null)
                message.task = String(object.task);
            return message;
        };

        /**
         * Creates a plain object from a PlayRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof omnireset.PlayRequest
         * @static
         * @param {omnireset.PlayRequest} message PlayRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PlayRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.task = "";
            if (message.task != null && message.hasOwnProperty("task"))
                object.task = message.task;
            return object;
        };

        /**
         * Converts this PlayRequest to JSON.
         * @function toJSON
         * @memberof omnireset.PlayRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PlayRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for PlayRequest
         * @function getTypeUrl
         * @memberof omnireset.PlayRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        PlayRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/omnireset.PlayRequest";
        };

        return PlayRequest;
    })();

    omnireset.Disturb = (function() {

        /**
         * Properties of a Disturb.
         * @memberof omnireset
         * @interface IDisturb
         */

        /**
         * Constructs a new Disturb.
         * @memberof omnireset
         * @classdesc Represents a Disturb.
         * @implements IDisturb
         * @constructor
         * @param {omnireset.IDisturb=} [properties] Properties to set
         */
        function Disturb(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new Disturb instance using the specified properties.
         * @function create
         * @memberof omnireset.Disturb
         * @static
         * @param {omnireset.IDisturb=} [properties] Properties to set
         * @returns {omnireset.Disturb} Disturb instance
         */
        Disturb.create = function create(properties) {
            return new Disturb(properties);
        };

        /**
         * Encodes the specified Disturb message. Does not implicitly {@link omnireset.Disturb.verify|verify} messages.
         * @function encode
         * @memberof omnireset.Disturb
         * @static
         * @param {omnireset.IDisturb} message Disturb message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Disturb.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified Disturb message, length delimited. Does not implicitly {@link omnireset.Disturb.verify|verify} messages.
         * @function encodeDelimited
         * @memberof omnireset.Disturb
         * @static
         * @param {omnireset.IDisturb} message Disturb message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Disturb.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Disturb message from the specified reader or buffer.
         * @function decode
         * @memberof omnireset.Disturb
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {omnireset.Disturb} Disturb
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Disturb.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.omnireset.Disturb();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Disturb message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof omnireset.Disturb
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {omnireset.Disturb} Disturb
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Disturb.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Disturb message.
         * @function verify
         * @memberof omnireset.Disturb
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Disturb.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a Disturb message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof omnireset.Disturb
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {omnireset.Disturb} Disturb
         */
        Disturb.fromObject = function fromObject(object) {
            if (object instanceof $root.omnireset.Disturb)
                return object;
            return new $root.omnireset.Disturb();
        };

        /**
         * Creates a plain object from a Disturb message. Also converts values to other types if specified.
         * @function toObject
         * @memberof omnireset.Disturb
         * @static
         * @param {omnireset.Disturb} message Disturb
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Disturb.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this Disturb to JSON.
         * @function toJSON
         * @memberof omnireset.Disturb
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Disturb.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for Disturb
         * @function getTypeUrl
         * @memberof omnireset.Disturb
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Disturb.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/omnireset.Disturb";
        };

        return Disturb;
    })();

    omnireset.Stop = (function() {

        /**
         * Properties of a Stop.
         * @memberof omnireset
         * @interface IStop
         */

        /**
         * Constructs a new Stop.
         * @memberof omnireset
         * @classdesc Represents a Stop.
         * @implements IStop
         * @constructor
         * @param {omnireset.IStop=} [properties] Properties to set
         */
        function Stop(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new Stop instance using the specified properties.
         * @function create
         * @memberof omnireset.Stop
         * @static
         * @param {omnireset.IStop=} [properties] Properties to set
         * @returns {omnireset.Stop} Stop instance
         */
        Stop.create = function create(properties) {
            return new Stop(properties);
        };

        /**
         * Encodes the specified Stop message. Does not implicitly {@link omnireset.Stop.verify|verify} messages.
         * @function encode
         * @memberof omnireset.Stop
         * @static
         * @param {omnireset.IStop} message Stop message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Stop.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified Stop message, length delimited. Does not implicitly {@link omnireset.Stop.verify|verify} messages.
         * @function encodeDelimited
         * @memberof omnireset.Stop
         * @static
         * @param {omnireset.IStop} message Stop message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Stop.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Stop message from the specified reader or buffer.
         * @function decode
         * @memberof omnireset.Stop
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {omnireset.Stop} Stop
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Stop.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.omnireset.Stop();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Stop message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof omnireset.Stop
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {omnireset.Stop} Stop
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Stop.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Stop message.
         * @function verify
         * @memberof omnireset.Stop
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Stop.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a Stop message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof omnireset.Stop
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {omnireset.Stop} Stop
         */
        Stop.fromObject = function fromObject(object) {
            if (object instanceof $root.omnireset.Stop)
                return object;
            return new $root.omnireset.Stop();
        };

        /**
         * Creates a plain object from a Stop message. Also converts values to other types if specified.
         * @function toObject
         * @memberof omnireset.Stop
         * @static
         * @param {omnireset.Stop} message Stop
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Stop.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this Stop to JSON.
         * @function toJSON
         * @memberof omnireset.Stop
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Stop.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for Stop
         * @function getTypeUrl
         * @memberof omnireset.Stop
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Stop.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/omnireset.Stop";
        };

        return Stop;
    })();

    omnireset.ClientToServer = (function() {

        /**
         * Properties of a ClientToServer.
         * @memberof omnireset
         * @interface IClientToServer
         * @property {omnireset.IPlayRequest|null} [playRequest] ClientToServer playRequest
         * @property {omnireset.IDisturb|null} [disturb] ClientToServer disturb
         * @property {omnireset.IStop|null} [stop] ClientToServer stop
         */

        /**
         * Constructs a new ClientToServer.
         * @memberof omnireset
         * @classdesc Represents a ClientToServer.
         * @implements IClientToServer
         * @constructor
         * @param {omnireset.IClientToServer=} [properties] Properties to set
         */
        function ClientToServer(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ClientToServer playRequest.
         * @member {omnireset.IPlayRequest|null|undefined} playRequest
         * @memberof omnireset.ClientToServer
         * @instance
         */
        ClientToServer.prototype.playRequest = null;

        /**
         * ClientToServer disturb.
         * @member {omnireset.IDisturb|null|undefined} disturb
         * @memberof omnireset.ClientToServer
         * @instance
         */
        ClientToServer.prototype.disturb = null;

        /**
         * ClientToServer stop.
         * @member {omnireset.IStop|null|undefined} stop
         * @memberof omnireset.ClientToServer
         * @instance
         */
        ClientToServer.prototype.stop = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * ClientToServer msg.
         * @member {"playRequest"|"disturb"|"stop"|undefined} msg
         * @memberof omnireset.ClientToServer
         * @instance
         */
        Object.defineProperty(ClientToServer.prototype, "msg", {
            get: $util.oneOfGetter($oneOfFields = ["playRequest", "disturb", "stop"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new ClientToServer instance using the specified properties.
         * @function create
         * @memberof omnireset.ClientToServer
         * @static
         * @param {omnireset.IClientToServer=} [properties] Properties to set
         * @returns {omnireset.ClientToServer} ClientToServer instance
         */
        ClientToServer.create = function create(properties) {
            return new ClientToServer(properties);
        };

        /**
         * Encodes the specified ClientToServer message. Does not implicitly {@link omnireset.ClientToServer.verify|verify} messages.
         * @function encode
         * @memberof omnireset.ClientToServer
         * @static
         * @param {omnireset.IClientToServer} message ClientToServer message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ClientToServer.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.playRequest != null && Object.hasOwnProperty.call(message, "playRequest"))
                $root.omnireset.PlayRequest.encode(message.playRequest, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.disturb != null && Object.hasOwnProperty.call(message, "disturb"))
                $root.omnireset.Disturb.encode(message.disturb, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.stop != null && Object.hasOwnProperty.call(message, "stop"))
                $root.omnireset.Stop.encode(message.stop, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ClientToServer message, length delimited. Does not implicitly {@link omnireset.ClientToServer.verify|verify} messages.
         * @function encodeDelimited
         * @memberof omnireset.ClientToServer
         * @static
         * @param {omnireset.IClientToServer} message ClientToServer message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ClientToServer.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ClientToServer message from the specified reader or buffer.
         * @function decode
         * @memberof omnireset.ClientToServer
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {omnireset.ClientToServer} ClientToServer
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ClientToServer.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.omnireset.ClientToServer();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.playRequest = $root.omnireset.PlayRequest.decode(reader, reader.uint32());
                        break;
                    }
                case 2: {
                        message.disturb = $root.omnireset.Disturb.decode(reader, reader.uint32());
                        break;
                    }
                case 3: {
                        message.stop = $root.omnireset.Stop.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ClientToServer message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof omnireset.ClientToServer
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {omnireset.ClientToServer} ClientToServer
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ClientToServer.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ClientToServer message.
         * @function verify
         * @memberof omnireset.ClientToServer
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ClientToServer.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.playRequest != null && message.hasOwnProperty("playRequest")) {
                properties.msg = 1;
                {
                    let error = $root.omnireset.PlayRequest.verify(message.playRequest);
                    if (error)
                        return "playRequest." + error;
                }
            }
            if (message.disturb != null && message.hasOwnProperty("disturb")) {
                if (properties.msg === 1)
                    return "msg: multiple values";
                properties.msg = 1;
                {
                    let error = $root.omnireset.Disturb.verify(message.disturb);
                    if (error)
                        return "disturb." + error;
                }
            }
            if (message.stop != null && message.hasOwnProperty("stop")) {
                if (properties.msg === 1)
                    return "msg: multiple values";
                properties.msg = 1;
                {
                    let error = $root.omnireset.Stop.verify(message.stop);
                    if (error)
                        return "stop." + error;
                }
            }
            return null;
        };

        /**
         * Creates a ClientToServer message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof omnireset.ClientToServer
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {omnireset.ClientToServer} ClientToServer
         */
        ClientToServer.fromObject = function fromObject(object) {
            if (object instanceof $root.omnireset.ClientToServer)
                return object;
            let message = new $root.omnireset.ClientToServer();
            if (object.playRequest != null) {
                if (typeof object.playRequest !== "object")
                    throw TypeError(".omnireset.ClientToServer.playRequest: object expected");
                message.playRequest = $root.omnireset.PlayRequest.fromObject(object.playRequest);
            }
            if (object.disturb != null) {
                if (typeof object.disturb !== "object")
                    throw TypeError(".omnireset.ClientToServer.disturb: object expected");
                message.disturb = $root.omnireset.Disturb.fromObject(object.disturb);
            }
            if (object.stop != null) {
                if (typeof object.stop !== "object")
                    throw TypeError(".omnireset.ClientToServer.stop: object expected");
                message.stop = $root.omnireset.Stop.fromObject(object.stop);
            }
            return message;
        };

        /**
         * Creates a plain object from a ClientToServer message. Also converts values to other types if specified.
         * @function toObject
         * @memberof omnireset.ClientToServer
         * @static
         * @param {omnireset.ClientToServer} message ClientToServer
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ClientToServer.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (message.playRequest != null && message.hasOwnProperty("playRequest")) {
                object.playRequest = $root.omnireset.PlayRequest.toObject(message.playRequest, options);
                if (options.oneofs)
                    object.msg = "playRequest";
            }
            if (message.disturb != null && message.hasOwnProperty("disturb")) {
                object.disturb = $root.omnireset.Disturb.toObject(message.disturb, options);
                if (options.oneofs)
                    object.msg = "disturb";
            }
            if (message.stop != null && message.hasOwnProperty("stop")) {
                object.stop = $root.omnireset.Stop.toObject(message.stop, options);
                if (options.oneofs)
                    object.msg = "stop";
            }
            return object;
        };

        /**
         * Converts this ClientToServer to JSON.
         * @function toJSON
         * @memberof omnireset.ClientToServer
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ClientToServer.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ClientToServer
         * @function getTypeUrl
         * @memberof omnireset.ClientToServer
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ClientToServer.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/omnireset.ClientToServer";
        };

        return ClientToServer;
    })();

    omnireset.State = (function() {

        /**
         * Properties of a State.
         * @memberof omnireset
         * @interface IState
         * @property {Array.<number>|null} [values] State values
         */

        /**
         * Constructs a new State.
         * @memberof omnireset
         * @classdesc Represents a State.
         * @implements IState
         * @constructor
         * @param {omnireset.IState=} [properties] Properties to set
         */
        function State(properties) {
            this.values = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * State values.
         * @member {Array.<number>} values
         * @memberof omnireset.State
         * @instance
         */
        State.prototype.values = $util.emptyArray;

        /**
         * Creates a new State instance using the specified properties.
         * @function create
         * @memberof omnireset.State
         * @static
         * @param {omnireset.IState=} [properties] Properties to set
         * @returns {omnireset.State} State instance
         */
        State.create = function create(properties) {
            return new State(properties);
        };

        /**
         * Encodes the specified State message. Does not implicitly {@link omnireset.State.verify|verify} messages.
         * @function encode
         * @memberof omnireset.State
         * @static
         * @param {omnireset.IState} message State message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        State.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.values != null && message.values.length) {
                writer.uint32(/* id 1, wireType 2 =*/10).fork();
                for (let i = 0; i < message.values.length; ++i)
                    writer.float(message.values[i]);
                writer.ldelim();
            }
            return writer;
        };

        /**
         * Encodes the specified State message, length delimited. Does not implicitly {@link omnireset.State.verify|verify} messages.
         * @function encodeDelimited
         * @memberof omnireset.State
         * @static
         * @param {omnireset.IState} message State message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        State.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a State message from the specified reader or buffer.
         * @function decode
         * @memberof omnireset.State
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {omnireset.State} State
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        State.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.omnireset.State();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        if (!(message.values && message.values.length))
                            message.values = [];
                        if ((tag & 7) === 2) {
                            let end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2)
                                message.values.push(reader.float());
                        } else
                            message.values.push(reader.float());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a State message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof omnireset.State
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {omnireset.State} State
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        State.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a State message.
         * @function verify
         * @memberof omnireset.State
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        State.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.values != null && message.hasOwnProperty("values")) {
                if (!Array.isArray(message.values))
                    return "values: array expected";
                for (let i = 0; i < message.values.length; ++i)
                    if (typeof message.values[i] !== "number")
                        return "values: number[] expected";
            }
            return null;
        };

        /**
         * Creates a State message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof omnireset.State
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {omnireset.State} State
         */
        State.fromObject = function fromObject(object) {
            if (object instanceof $root.omnireset.State)
                return object;
            let message = new $root.omnireset.State();
            if (object.values) {
                if (!Array.isArray(object.values))
                    throw TypeError(".omnireset.State.values: array expected");
                message.values = [];
                for (let i = 0; i < object.values.length; ++i)
                    message.values[i] = Number(object.values[i]);
            }
            return message;
        };

        /**
         * Creates a plain object from a State message. Also converts values to other types if specified.
         * @function toObject
         * @memberof omnireset.State
         * @static
         * @param {omnireset.State} message State
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        State.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.values = [];
            if (message.values && message.values.length) {
                object.values = [];
                for (let j = 0; j < message.values.length; ++j)
                    object.values[j] = options.json && !isFinite(message.values[j]) ? String(message.values[j]) : message.values[j];
            }
            return object;
        };

        /**
         * Converts this State to JSON.
         * @function toJSON
         * @memberof omnireset.State
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        State.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for State
         * @function getTypeUrl
         * @memberof omnireset.State
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        State.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/omnireset.State";
        };

        return State;
    })();

    omnireset.ErrorMsg = (function() {

        /**
         * Properties of an ErrorMsg.
         * @memberof omnireset
         * @interface IErrorMsg
         * @property {string|null} [message] ErrorMsg message
         */

        /**
         * Constructs a new ErrorMsg.
         * @memberof omnireset
         * @classdesc Represents an ErrorMsg.
         * @implements IErrorMsg
         * @constructor
         * @param {omnireset.IErrorMsg=} [properties] Properties to set
         */
        function ErrorMsg(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ErrorMsg message.
         * @member {string} message
         * @memberof omnireset.ErrorMsg
         * @instance
         */
        ErrorMsg.prototype.message = "";

        /**
         * Creates a new ErrorMsg instance using the specified properties.
         * @function create
         * @memberof omnireset.ErrorMsg
         * @static
         * @param {omnireset.IErrorMsg=} [properties] Properties to set
         * @returns {omnireset.ErrorMsg} ErrorMsg instance
         */
        ErrorMsg.create = function create(properties) {
            return new ErrorMsg(properties);
        };

        /**
         * Encodes the specified ErrorMsg message. Does not implicitly {@link omnireset.ErrorMsg.verify|verify} messages.
         * @function encode
         * @memberof omnireset.ErrorMsg
         * @static
         * @param {omnireset.IErrorMsg} message ErrorMsg message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ErrorMsg.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.message);
            return writer;
        };

        /**
         * Encodes the specified ErrorMsg message, length delimited. Does not implicitly {@link omnireset.ErrorMsg.verify|verify} messages.
         * @function encodeDelimited
         * @memberof omnireset.ErrorMsg
         * @static
         * @param {omnireset.IErrorMsg} message ErrorMsg message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ErrorMsg.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an ErrorMsg message from the specified reader or buffer.
         * @function decode
         * @memberof omnireset.ErrorMsg
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {omnireset.ErrorMsg} ErrorMsg
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ErrorMsg.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.omnireset.ErrorMsg();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.message = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an ErrorMsg message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof omnireset.ErrorMsg
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {omnireset.ErrorMsg} ErrorMsg
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ErrorMsg.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an ErrorMsg message.
         * @function verify
         * @memberof omnireset.ErrorMsg
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ErrorMsg.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.message != null && message.hasOwnProperty("message"))
                if (!$util.isString(message.message))
                    return "message: string expected";
            return null;
        };

        /**
         * Creates an ErrorMsg message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof omnireset.ErrorMsg
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {omnireset.ErrorMsg} ErrorMsg
         */
        ErrorMsg.fromObject = function fromObject(object) {
            if (object instanceof $root.omnireset.ErrorMsg)
                return object;
            let message = new $root.omnireset.ErrorMsg();
            if (object.message != null)
                message.message = String(object.message);
            return message;
        };

        /**
         * Creates a plain object from an ErrorMsg message. Also converts values to other types if specified.
         * @function toObject
         * @memberof omnireset.ErrorMsg
         * @static
         * @param {omnireset.ErrorMsg} message ErrorMsg
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ErrorMsg.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.message = "";
            if (message.message != null && message.hasOwnProperty("message"))
                object.message = message.message;
            return object;
        };

        /**
         * Converts this ErrorMsg to JSON.
         * @function toJSON
         * @memberof omnireset.ErrorMsg
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ErrorMsg.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ErrorMsg
         * @function getTypeUrl
         * @memberof omnireset.ErrorMsg
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ErrorMsg.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/omnireset.ErrorMsg";
        };

        return ErrorMsg;
    })();

    omnireset.Complete = (function() {

        /**
         * Properties of a Complete.
         * @memberof omnireset
         * @interface IComplete
         */

        /**
         * Constructs a new Complete.
         * @memberof omnireset
         * @classdesc Represents a Complete.
         * @implements IComplete
         * @constructor
         * @param {omnireset.IComplete=} [properties] Properties to set
         */
        function Complete(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new Complete instance using the specified properties.
         * @function create
         * @memberof omnireset.Complete
         * @static
         * @param {omnireset.IComplete=} [properties] Properties to set
         * @returns {omnireset.Complete} Complete instance
         */
        Complete.create = function create(properties) {
            return new Complete(properties);
        };

        /**
         * Encodes the specified Complete message. Does not implicitly {@link omnireset.Complete.verify|verify} messages.
         * @function encode
         * @memberof omnireset.Complete
         * @static
         * @param {omnireset.IComplete} message Complete message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Complete.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified Complete message, length delimited. Does not implicitly {@link omnireset.Complete.verify|verify} messages.
         * @function encodeDelimited
         * @memberof omnireset.Complete
         * @static
         * @param {omnireset.IComplete} message Complete message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Complete.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Complete message from the specified reader or buffer.
         * @function decode
         * @memberof omnireset.Complete
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {omnireset.Complete} Complete
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Complete.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.omnireset.Complete();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Complete message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof omnireset.Complete
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {omnireset.Complete} Complete
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Complete.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Complete message.
         * @function verify
         * @memberof omnireset.Complete
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Complete.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a Complete message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof omnireset.Complete
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {omnireset.Complete} Complete
         */
        Complete.fromObject = function fromObject(object) {
            if (object instanceof $root.omnireset.Complete)
                return object;
            return new $root.omnireset.Complete();
        };

        /**
         * Creates a plain object from a Complete message. Also converts values to other types if specified.
         * @function toObject
         * @memberof omnireset.Complete
         * @static
         * @param {omnireset.Complete} message Complete
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Complete.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this Complete to JSON.
         * @function toJSON
         * @memberof omnireset.Complete
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Complete.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for Complete
         * @function getTypeUrl
         * @memberof omnireset.Complete
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Complete.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/omnireset.Complete";
        };

        return Complete;
    })();

    omnireset.ServerToClient = (function() {

        /**
         * Properties of a ServerToClient.
         * @memberof omnireset
         * @interface IServerToClient
         * @property {omnireset.IState|null} [state] ServerToClient state
         * @property {omnireset.IErrorMsg|null} [errorMsg] ServerToClient errorMsg
         * @property {omnireset.IComplete|null} [complete] ServerToClient complete
         */

        /**
         * Constructs a new ServerToClient.
         * @memberof omnireset
         * @classdesc Represents a ServerToClient.
         * @implements IServerToClient
         * @constructor
         * @param {omnireset.IServerToClient=} [properties] Properties to set
         */
        function ServerToClient(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ServerToClient state.
         * @member {omnireset.IState|null|undefined} state
         * @memberof omnireset.ServerToClient
         * @instance
         */
        ServerToClient.prototype.state = null;

        /**
         * ServerToClient errorMsg.
         * @member {omnireset.IErrorMsg|null|undefined} errorMsg
         * @memberof omnireset.ServerToClient
         * @instance
         */
        ServerToClient.prototype.errorMsg = null;

        /**
         * ServerToClient complete.
         * @member {omnireset.IComplete|null|undefined} complete
         * @memberof omnireset.ServerToClient
         * @instance
         */
        ServerToClient.prototype.complete = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * ServerToClient msg.
         * @member {"state"|"errorMsg"|"complete"|undefined} msg
         * @memberof omnireset.ServerToClient
         * @instance
         */
        Object.defineProperty(ServerToClient.prototype, "msg", {
            get: $util.oneOfGetter($oneOfFields = ["state", "errorMsg", "complete"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new ServerToClient instance using the specified properties.
         * @function create
         * @memberof omnireset.ServerToClient
         * @static
         * @param {omnireset.IServerToClient=} [properties] Properties to set
         * @returns {omnireset.ServerToClient} ServerToClient instance
         */
        ServerToClient.create = function create(properties) {
            return new ServerToClient(properties);
        };

        /**
         * Encodes the specified ServerToClient message. Does not implicitly {@link omnireset.ServerToClient.verify|verify} messages.
         * @function encode
         * @memberof omnireset.ServerToClient
         * @static
         * @param {omnireset.IServerToClient} message ServerToClient message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ServerToClient.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.state != null && Object.hasOwnProperty.call(message, "state"))
                $root.omnireset.State.encode(message.state, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.errorMsg != null && Object.hasOwnProperty.call(message, "errorMsg"))
                $root.omnireset.ErrorMsg.encode(message.errorMsg, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.complete != null && Object.hasOwnProperty.call(message, "complete"))
                $root.omnireset.Complete.encode(message.complete, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ServerToClient message, length delimited. Does not implicitly {@link omnireset.ServerToClient.verify|verify} messages.
         * @function encodeDelimited
         * @memberof omnireset.ServerToClient
         * @static
         * @param {omnireset.IServerToClient} message ServerToClient message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ServerToClient.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ServerToClient message from the specified reader or buffer.
         * @function decode
         * @memberof omnireset.ServerToClient
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {omnireset.ServerToClient} ServerToClient
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ServerToClient.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.omnireset.ServerToClient();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.state = $root.omnireset.State.decode(reader, reader.uint32());
                        break;
                    }
                case 2: {
                        message.errorMsg = $root.omnireset.ErrorMsg.decode(reader, reader.uint32());
                        break;
                    }
                case 3: {
                        message.complete = $root.omnireset.Complete.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ServerToClient message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof omnireset.ServerToClient
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {omnireset.ServerToClient} ServerToClient
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ServerToClient.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ServerToClient message.
         * @function verify
         * @memberof omnireset.ServerToClient
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ServerToClient.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.state != null && message.hasOwnProperty("state")) {
                properties.msg = 1;
                {
                    let error = $root.omnireset.State.verify(message.state);
                    if (error)
                        return "state." + error;
                }
            }
            if (message.errorMsg != null && message.hasOwnProperty("errorMsg")) {
                if (properties.msg === 1)
                    return "msg: multiple values";
                properties.msg = 1;
                {
                    let error = $root.omnireset.ErrorMsg.verify(message.errorMsg);
                    if (error)
                        return "errorMsg." + error;
                }
            }
            if (message.complete != null && message.hasOwnProperty("complete")) {
                if (properties.msg === 1)
                    return "msg: multiple values";
                properties.msg = 1;
                {
                    let error = $root.omnireset.Complete.verify(message.complete);
                    if (error)
                        return "complete." + error;
                }
            }
            return null;
        };

        /**
         * Creates a ServerToClient message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof omnireset.ServerToClient
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {omnireset.ServerToClient} ServerToClient
         */
        ServerToClient.fromObject = function fromObject(object) {
            if (object instanceof $root.omnireset.ServerToClient)
                return object;
            let message = new $root.omnireset.ServerToClient();
            if (object.state != null) {
                if (typeof object.state !== "object")
                    throw TypeError(".omnireset.ServerToClient.state: object expected");
                message.state = $root.omnireset.State.fromObject(object.state);
            }
            if (object.errorMsg != null) {
                if (typeof object.errorMsg !== "object")
                    throw TypeError(".omnireset.ServerToClient.errorMsg: object expected");
                message.errorMsg = $root.omnireset.ErrorMsg.fromObject(object.errorMsg);
            }
            if (object.complete != null) {
                if (typeof object.complete !== "object")
                    throw TypeError(".omnireset.ServerToClient.complete: object expected");
                message.complete = $root.omnireset.Complete.fromObject(object.complete);
            }
            return message;
        };

        /**
         * Creates a plain object from a ServerToClient message. Also converts values to other types if specified.
         * @function toObject
         * @memberof omnireset.ServerToClient
         * @static
         * @param {omnireset.ServerToClient} message ServerToClient
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ServerToClient.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (message.state != null && message.hasOwnProperty("state")) {
                object.state = $root.omnireset.State.toObject(message.state, options);
                if (options.oneofs)
                    object.msg = "state";
            }
            if (message.errorMsg != null && message.hasOwnProperty("errorMsg")) {
                object.errorMsg = $root.omnireset.ErrorMsg.toObject(message.errorMsg, options);
                if (options.oneofs)
                    object.msg = "errorMsg";
            }
            if (message.complete != null && message.hasOwnProperty("complete")) {
                object.complete = $root.omnireset.Complete.toObject(message.complete, options);
                if (options.oneofs)
                    object.msg = "complete";
            }
            return object;
        };

        /**
         * Converts this ServerToClient to JSON.
         * @function toJSON
         * @memberof omnireset.ServerToClient
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ServerToClient.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ServerToClient
         * @function getTypeUrl
         * @memberof omnireset.ServerToClient
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ServerToClient.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/omnireset.ServerToClient";
        };

        return ServerToClient;
    })();

    return omnireset;
})();

export { $root as default };
