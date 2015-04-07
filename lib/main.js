var E = '',
    /**
     * Default separator while retrieving values of multi-level keys.
     * @const
     * @type {string}
     */
    DEFAULT_SEPARATOR = '_', // default separator value constant

    /**
     * Accepts a string and replaces all non alphabetic characters with default separator and converts characters to
     * uppercase.
     *
     * @param {object}  key
     * @param {string=} [separator=}
     * @returns {string}
     */
    rekey = function (key, separator) {
        return key.toUpperCase().replace(/[^a-zA-Z]/g, separator || E);
    },

    /**
     * Stores the set of typecast functions to be applied when retrieving values from environment.
     *
     * @enum
     * @type {Objeck<function>}
     */
    typecasts = {
        'string': global.String,
        'number': global.Number,
        'undefined': global.String,
        'boolean': global.Boolean
    },

    // main function that parses objects
    lift;

/**
 * Recursively traverses through objects and whenever native value types are encountered, replaces it with corresponding
 * data from environment variables.
 *
 * @param {object} obj
 * @param {string=} [namespace=] - Ensure that the namespace is pre-transformed. This improves performance.
 * @param {string=} [separator=_]
 * @param {function} transformer - The key name to pick data is forwarded as parameter and the value returned by the
 * transformer function is used to lookup environment variables.
 */
lift = function (obj, namespace, separator, transformer, _debug) {
    var key,
        cast,
        eKey;

    // iterate on each item in this object and operate on their keys.
    for (key in obj) {
        // only process keys that are owned by this object
        if (!obj.hasOwnProperty(key)) {
            continue;
        }

        // determine the type of the value and extract the casting function.
        cast = typecasts[typeof obj[key]];
        !cast && (obj[key] === null) && (cast = typecasts.undefined); // specially handle null

        // generate the equivalent environment key for the namespace
        eKey = (namespace || E) + separator + (transformer ? transformer(key, separator) : key);

        // if a cast function is there, it implies that native value is detected and we need to lookup environment
        if (cast) {
            // if environment has a truthy variable, we replace the original value with this.
            if (process.env[eKey]) {
                _debug && console.log('env-lift: %s =', eKey, cast(process.env[eKey]));
                obj[key] = cast(process.env[eKey]);
            }
        }
        // otherwise, we recurse into the value of the property
        else {
            lift(obj[key], eKey, separator, transformer, _debug);
        }
    }

    return obj;
};

module.exports = /** @lends module:env-lift */ {
    /**
     * Replaces values in `reference` object with equivalent definition of environment variables prefixed with
     * `namespace` and object's key path.
     *
     * @note This function mutes the original reference object.
     *
     * @param {string} namespace
     * @param {object} reference
     *
     * @example
     * require('env-lift').load('test', {
     *     port: 123,
     *     name: 'Sample Text'
     * });
     *
     * // if there is an environment variable TEST_PORT=8080
     * // The above would return: {
     * //     port: 8080,
     * //     name: 'Sample Text'
     * // }
     */
    load: function (namespace, reference, _debug) {
        return lift(reference, rekey(namespace || E, DEFAULT_SEPARATOR), DEFAULT_SEPARATOR, rekey, _debug ||
            !!process.env.ENV_LIFT_DEBUG);
    }
};