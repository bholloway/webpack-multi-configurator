# Webpack Multi Configurator

Use webpack-configurator for multi-compiler implementations

## Rationale

Using [webpack-configurator](https://www.npmjs.com/package/webpack-configurator) is an extensible way to develop a webpack configuration object.

However, sometimes you will be be managing an array of configurators for Webpack [multi-compiler](https://github.com/webpack/webpack/tree/master/examples/multi-compiler).

There are a number of use cases - You may be compiling a number of similar applications in the one project, or want to watch and rebuild both your application and your test code with one script.

Each compiler configuration may share similarities and you will want to share aspects between them.

## Usage

### Example

The following is a example where `app` and `test` both share `common`:

In `example.js`:

```javascript
var webpackMultiConfigurator = require('webpack-multi-configurator');

const DEFAULT_OPTIONS = {...};

module.exports = webpackMultiConfigurator(DEFAULT_OPTIONS)

  .define('common')
    .append(require('./common'))
	
  .define('app')
    .append(require('./app'))
    .append('common')
	
  .define('test')
    .append(require('./test'))
    .append('common')
	
  .create(process.env, ...)   // apply actual options
  
  .include(process.env.MODE)  // run app|test depending on environment variable
  .otherwise('app+test')	  // otherwise run both
  .resolve()
```

Where `app.js`, `test.js`, and `common.js` are **operations** (or **mixins**) of the form:

```javascript
module.exports = function (configurator, options) {
  return configurator
    .merge(...);
}
```

## Creation

**`webpackMultiConfigurator(defaultOpts:object, factory:function, merge:function)`**

The **default options** are important because any property that has a default value may be parsed from an environment variable (see create).

The **configurator factory** function is a way to add additional functionality to `webpack-configurator`. It is used where a **generator** (see definition) is not specified and has the same form. It may typically be omitted.

The **merge** function is used to merge options. It is typically omitted since the in-built merge function permits parsing of **environment variables** (see create).

**`create(...)`**

The create method creates an instance that inherits the definitions from the parent instance. Interitance is by copy, so changes to either child or parent will not mutate the other.

Arguments may be any number of **options** hashes, or a configurator **factory** method. The options are merged with the options of the parent and the factory will be passed the factory of the parent.

### Environment Variables

In initial example, the full `process.env` was passed to the `create()` function.

Options may be parsed from **environment variables** so long as:
* The option key is fully uppercase; and,
* The value of the option has been previously initialised to any `boolean|number|string`  by way of `defaultOpts` or parent `create()` call; and,
* Underscore is used only to indicate camel-case, and double underscore is used only to indicate nesting.

The option `SOME_PROP` will actually set the field `someProp`. And the environement variable `SOME__NESTED__PROP` will set the field `some.nested.prop`.

## Definition

Any given multi-configurator is composed of a number of definitions, essentually a generator followed by a sequence of operations.

The example:

```javascript
.define('foo')
  .generate(generator)
  .append(mixinA)
  .prepend(mixinB)
  .append(mixinC)
```

Where the `generator` and `mixin*` are functions defined elsewhere.

In the case that the generator returns 3 elements, the structure will be:

![](./doc/operations.svg)

A definition is begun with `define()`, after which it supports the methods:

* `generate(generator)`
* `append(mixin)`
* `prepend(mixin)`
* `splice(index, deleteCount, mixin)`

The `mixin` may be single element or an Array thereof. We use the term **operation** and **mixin** interchangably to represent a mutation of the `webpack-configurator` instance.

All methods are chainable.

### Generator

The defined sequence is fed with `webpack-configurator` instances, created by a **generator**.

```javascript
function generatorFn(factoryFn():configurator, options:object):configurator|Array.<configurator>
```

The generator is passed a **factory function** which will yeild a `webpack-configurator` when called. Normally the generator may be omitted and the factory function will generate a single instance.

If your project needs to compile several similar applications then it makes sense to have a generator which will return an Array of configurators, one for each application.

### Operations

In the given example the generator is returning an Array of 3 configurators.

These configurators will each take independent but identical paths through the defined **operations**.

```javascript
function opeartionFn(config:configurator, options:object):configurator
```

Each is passed a configurator instance and is expected to return a configurator instance. Typically it will mutate and return the same instance. If it does not return anything then the input instance will be carried forward.

Within each definition, operations are be unique. When there is repetition then the first instance is used.

### Organisation

Consider the more complex example:

```javascript
.define('common')
  .append(mixinX)
  .append(mixinY)
.define('foo')
  .append(mixinA)
  .append('common')
  .append(mixinB)
```

Where the `mixin*` are functions defined elsewhere.

![](./doc/common.svg)

In this case the definition of `foo` includes all operations from the definition of `common`.

While the operations in each definition are guaranteed unique, there is **not** a check for duplication when definitions are combined in this way.

In the example there is no generator function specified for `foo`. Should `foo` specify a generator that returns multiple configurators then each would follow identical (but separate) paths as shown.

## Inclusion

Once you have some definitions you will want to resolve them to some useful list of Webpack configuration objects.

To do this there are a number of methods:

**`.include(name:string)`**

Include a named definition. Any non-alphanumberic character may be used to join names so that several may be specified.

For example, `foo+bar` will include the definition of both `foo` and `bar`.

**`.exclude(name:string)`**

Exclude a named definition. Any non-alphanumberic character may be used to join names so that several may be specified.

For example, `foo+bar` will exclude the definition of both `foo` and `bar`.

Order is important. Including, then excluding, then including a definition will result in it being included.

**`.otherwise(name:string)`**

Definitions to use when none are included. Any non-alphanumberic character may be used to join names so that several may be specified.

**`.resolve()`**

Commits the inclusions and processes definitions, resulting in a list of `webpack-configurator` instances.

The `resolve()` method is then called on each `webpack-configurator` to bake it into a Webpack configuration object.