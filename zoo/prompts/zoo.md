zoo
Work seamlessly with Zoo from the command line

Subcommands
zoo alias
zoo api
zoo api-call
zoo app
zoo auth
zoo completion
zoo config
zoo drake
zoo file
zoo generate
zoo kcl
zoo ml
zoo say
zoo start-session
zoo open
zoo update
zoo user
zoo version
Options
-d/--debug
Print debug info
Default value: false
-h/--help
Print help (see a summary with '-h')
-V/--version
Print version
About
You've never CAD it so good.

Environment variables that can be used with zoo.

ZOO_TOKEN: an authentication token for Zoo API requests. Setting this avoids being prompted to authenticate and takes precedence over previously stored credentials.

ZOO_HOST: specify the Zoo hostname for commands that would otherwise assume the "api.zoo.dev" host.

ZOO_BROWSER, BROWSER (in order of precedence): the web browser to use for opening links.

DEBUG: set to any value to enable verbose output to standard error.

ZOO_PAGER, PAGER (in order of precedence): a terminal paging program to send standard output to, e.g. "less".

NO_COLOR: set to any value to avoid printing ANSI escape sequences for color output.

CLICOLOR: set to "0" to disable printing ANSI colors in output.

CLICOLOR_FORCE: set to a value other than "0" to keep ANSI colors in output even when the output is piped.

ZOO_FORCE_TTY: set to any value to force terminal-style output even when the output is redirected. When the value is a number, it is interpreted as the number of columns available in the viewport. When the value is a percentage, it will be applied against the number of columns available in the current viewport.

ZOO_NO_UPDATE_NOTIFIER: set to any value to disable update notifications. By default, zoo checks for new releases once every 24 hours and displays an upgrade notice on standard error if a newer version was found.

ZOO_CONFIG_DIR: the directory where zoo will store configuration files. Default: $XDG_CONFIG_HOME/zoo or $HOME/.config/zoo.

API Reference
Zoo's APIs are organized around REST. Our APIs have predictable resource-oriented URLs, accept JSON-encoded request bodies, return JSON-encoded responses, and use standard HTTP response codes, authentication, and verbs.

The root endpoint / returns the OpenAPI specification for the API. It's handy if you want to use it to generate things.

API →
Authentication
Zoo's APIs use API keys, also referred to as API tokens, to authenticate requests. You can view and manage your API keys in your account on the Zoo website.

Authentication to the API is performed via Bearer Token Auth. Provide your API key as the token value. We will automatically add your token to the examples here if you are logged in.

All API requests must be made over HTTPS. API requests without authentication will fail.

API →
Errors
Zoo uses conventional HTTP response codes to indicate the success or failure of an API request. In general: Codes in the 2xx range indicate success. Codes in the 4xx range indicate an error that failed given the information provided (e.g., a required parameter was omitted, etc.). Codes in the 5xx range indicate an error with Zoo's servers (these are rare).

HTTP STATUS CODE SUMMARY
400
Bad Request	The request failed could not authenticate, but the token existed.
401
Unauthorized	No valid API key provided.
403
Forbidden	The API key doesn't have permissions to perform the request.
404
Not Found	The requested resource doesn't exist.
406
Not Acceptable	The request was unacceptable, often due to missing a required parameter.
500
Internal Server Error	The server encountered an unexpected condition that prevented it from fulfilling the request.

API →
API Calls
API calls that have been performed by users can be queried by the API. This is helpful for debugging as well as billing.

Endpoints
GET
/api-call-metrics
GET
/api-calls
GET
/api-calls/{id}
GET
/async/operations
GET
/async/operations/{id}
GET
/org/api-calls
GET
/org/api-calls/{id}
GET
/user/api-calls
GET
/user/api-calls/{id}
GET
/users/{id}/api-calls

API →
API Tokens
API tokens allow users to call the API outside of their session token that is used as a cookie in the user interface. Users can create, delete, and list their API tokens. But, of course, you need an API token to do this, so first be sure to generate one in the account UI.

Endpoints
GET
/user/api-tokens
POST
/user/api-tokens
GET
/user/api-tokens/{token}
DELETE
/user/api-tokens/{token}

Apps
Endpoints for third party app grant flows.

Endpoints
GET
/apps/github/callback
GET
/apps/github/consent
POST
/apps/github/webhook

API →
Executor
Endpoints that allow for code execution or creation of code execution environments.

Endpoints
POST
/file/execute/{lang}
GET
/ws/executor/term


API →
File
CAD file operations. Create, get, and list CAD file conversions. More endpoints will be added here in the future as we build out transforms, etc on CAD models.

Endpoints
POST
/file/center-of-mass
POST
/file/conversion/{src_format}/{output_format}
POST
/file/density
POST
/file/mass
POST
/file/surface-area
POST
/file/volume

API →
Meta
Meta information about the API.

Endpoints
GET
/
GET
/_meta/info
GET
/_meta/ipinfo
GET
/community/sso
POST
/debug/uploads
POST
/events
GET
/internal/discord/api-token/{discord_id}
GET
/ping
GET
/pricing/subscriptions

ML
Machine learning to generate CAD models and other things.

Endpoints
POST
/ai/text-to-cad/{output_format}
GET
/ml-prompts
GET
/ml-prompts/{id}
POST
/ml/kcl/completions
POST
/ml/text-to-cad/iteration
GET
/user/text-to-cad
GET
/user/text-to-cad/{id}
POST
/user/text-to-cad/{id}

API →
Modeling
Modeling API for updating your 3D files using the Zoo engine.

Endpoints
GET
/ws/modeling/commands

API →
Oauth2
Endpoints that implement OAuth 2.0 grant flows.

Endpoints
POST
/oauth2/device/auth
POST
/oauth2/device/confirm
POST
/oauth2/device/token
GET
/oauth2/device/verify
GET
/oauth2/provider/{provider}/callback
POST
/oauth2/provider/{provider}/callback
GET
/oauth2/provider/{provider}/consent
POST
/oauth2/token/revoke


API →
Orgs
An organization is a group of users of the Zoo API. Here, we can add users to an org and perform operations on orgs.

Endpoints
GET
/org
PUT
/org
POST
/org
DELETE
/org
GET
/org/members
POST
/org/members
GET
/org/members/{user_id}
PUT
/org/members/{user_id}
DELETE
/org/members/{user_id}
GET
/org/privacy
PUT
/org/privacy
GET
/org/saml/idp
PUT
/org/saml/idp
POST
/org/saml/idp
DELETE
/org/saml/idp
GET
/org/shortlinks
GET
/orgs
GET
/orgs/{id}
PUT
/orgs/{id}/enterprise/pricing
GET
/user/org


API →
Payments
Operations around payments and billing.

Endpoints
GET
/org/payment
PUT
/org/payment
POST
/org/payment
DELETE
/org/payment
GET
/org/payment/balance
POST
/org/payment/intent
GET
/org/payment/invoices
GET
/org/payment/methods
DELETE
/org/payment/methods/{id}
GET
/org/payment/subscriptions
PUT
/org/payment/subscriptions
POST
/org/payment/subscriptions
GET
/org/payment/tax
GET
/orgs/{id}/payment/balance
PUT
/orgs/{id}/payment/balance
GET
/user/payment
PUT
/user/payment
POST
/user/payment
DELETE
/user/payment
GET
/user/payment/balance
POST
/user/payment/intent
GET
/user/payment/invoices
GET
/user/payment/methods
DELETE
/user/payment/methods/{id}
GET
/user/payment/subscriptions
PUT
/user/payment/subscriptions
POST
/user/payment/subscriptions
GET
/user/payment/tax
GET
/users/{id}/payment/balance
PUT
/users/{id}/payment/balance

API →
Service Accounts
Service accounts allow organizations to call the API. Organization admins can create, delete, and list the service accounts for their org. Service accounts are scoped to an organization not individual users, these are better to use for automations than individual API tokens, since they won't stop working when an individual leaves the company.

Endpoints
GET
/org/service-accounts
POST
/org/service-accounts
GET
/org/service-accounts/{token}
DELETE
/org/service-accounts/{token}

API →
Shortlinks
Shortlinks are a way to create a short URL that redirects to a longer URL. This is useful for sharing links that are long and unwieldy.

Endpoints
GET
/org/shortlinks
GET
/user/shortlinks
POST
/user/shortlinks
GET
/user/shortlinks/{key}
PUT
/user/shortlinks/{key}
DELETE
/user/shortlinks/{key}

Store
Operations involving our swag store.

Endpoints
POST
/store/coupon


API →
Unit
Unit conversion operations.

Endpoints
GET
/unit/conversion/angle/{input_unit}/{output_unit}
GET
/unit/conversion/area/{input_unit}/{output_unit}
GET
/unit/conversion/current/{input_unit}/{output_unit}
GET
/unit/conversion/energy/{input_unit}/{output_unit}
GET
/unit/conversion/force/{input_unit}/{output_unit}
GET
/unit/conversion/frequency/{input_unit}/{output_unit}
GET
/unit/conversion/length/{input_unit}/{output_unit}
GET
/unit/conversion/mass/{input_unit}/{output_unit}
GET
/unit/conversion/power/{input_unit}/{output_unit}
GET
/unit/conversion/pressure/{input_unit}/{output_unit}
GET
/unit/conversion/temperature/{input_unit}/{output_unit}
GET
/unit/conversion/torque/{input_unit}/{output_unit}
GET
/unit/conversion/volume/{input_unit}/{output_unit}

API →
Users
A user is someone who uses the Zoo API. Here, we can create, delete, and list users. We can also get information about a user. Operations will only be authorized if the user is requesting information about themselves.

Endpoints
GET
/user
PUT
/user
DELETE
/user
GET
/user/extended
GET
/user/oauth2/providers
GET
/user/onboarding
GET
/user/org
GET
/user/privacy
PUT
/user/privacy
GET
/user/session/{token}
GET
/user/shortlinks
POST
/user/shortlinks
GET
/user/shortlinks/{key}
PUT
/user/shortlinks/{key}
DELETE
/user/shortlinks/{key}
GET
/users
GET
/users-extended
GET
/users-extended/{id}
GET
/users/{id}