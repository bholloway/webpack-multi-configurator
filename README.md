# Webpack Multi Configurator

[![NPM](https://nodei.co/npm/webpack-multi-configurator.png)](https://www.npmjs.com/package/webpack-multi-configurator)

[![appveyor](https://ci.appveyor.com/api/projects/status/lhivjlaw9e31c5p2?svg=true)](https://ci.appveyor.com/project/bholloway/webpack-multi-configurator)
[![travis](https://api.travis-ci.org/bholloway/webpack-multi-configurator.svg)](https://travis-ci.org/bholloway/webpack-multi-configurator)

Use webpack-configurator for multi-compiler implementations

## Rationale

Using [webpack-configurator](https://www.npmjs.com/package/webpack-configurator) is an extensible way to develop a webpack configuration object.

However, sometimes you will be be managing an array of configurators for Webpack [multi-compiler](https://github.com/webpack/webpack/tree/master/examples/multi-compiler).

There are a number of use cases - You may be compiling a number of similar applications in the one project, or want to watch and rebuild both your application and your test code with one script.

Each compiler configuration may share similarities and you will want to compose using shared coded.

## Usage

There are 2 stages to creating and consuming a configuration.

1. Make some **definitions**, which may reference each other.
2. **Include** some of those definitions and **resolve** an Array of Webpack configuration objects.

It is typical that **between these steps** a child instance is **create**d from the parent instance. This allows the original instance to specify default options and the child instance to merge actual options over the top.

The following is a example where `app` and `test` both share `common`.

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
	
  .create(process.env, ...)   // inherit and apply actual options
  
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

Strictly speaking, definition and inclusion may be placed in in any order allowing **extensibility**.
 
A common use-case is for a delegate module to feature the `define` statements and a project being built to add the remainder. That project may also extend any of the definitions that the delegate has made.

## Creation

### Initialise

```javascript
function webpackMultiConfigurator(defaultOpts:object, configuratorFactory:function, merge:function)
```

The **default options** are important because any property that has a default value may be parsed from an environment variable (see create).

The **configurator factory** function is a way to add additional functionality to `webpack-configurator`. It is used where a **generator** (see definition) is not specified and has the same form. It may typically be omitted.

The **merge** function is used to merge options. It is typically omitted since the in-built merge function permits parsing of **environment variables** (see create).

### Create

```javascript
function create(...optionsOrFactory:object|function)
```

The create method creates an instance that inherits the definitions from the parent instance. Interitance is a simple copy, so changes to either child or parent will not mutate the other.

Arguments may be any number of **options** hashes, or a configurator **factory** method.

The options are merged with the options of the parent and the new factory will be passed the factory of the parent.

### Environment Variables

In the example, the full `process.env` was passed to the `create()` function.

Options may be parsed from **environment variables** so long as:
* The default `merge` function is used (see initialisation above)
* The **key** of the option is fully uppercase
* The **value** of the option has been previously initialised to any `boolean|number|string`  by way of initialisation or `create()` call
* An underscore character in the key indicates the camel-case option field. So the option `SOME_PROP` will actually set the field `someProp`.
* A double underscore in the key indicates a nested option field. So the option `SOME__NESTED__PROP` will set the field `some.nested.prop`.

## Definition

Any given multi-configurator is composed of a number of definitions, essentially a generator followed by a sequence of operations.

For example:

```javascript
.define('foo')
  .generate(generator)
  .append(mixinA)
  .prepend(mixinB)
  .append(mixinC)
```

Where the `generator` and `mixin*` are functions defined elsewhere.

Imagine that the given `generator` returns 3 `webpack-configurator` instances, the defined operations will be applied seperately to all 3 configurators.

![](./doc/operations.png?raw=true)

A definition is begun with `define(name:string)`. Where the `name` is comprised of **alpha-numeric characters** only.

The returned object has all the members of the instance, along with additional methods that relate to the named definition:

* `clear()`
* `generate(generator:function)`
* `append(mixin:function|string|Array.<function|string>)`
* `prepend(mixin:function|string|Array.<function|string>)`
* `splice(start:number, deleteCount:number, mixin:function|string|Array.<function|string>)`

All methods are chainable.

The `mixin` may be single element or an Array. We use the term **operation** and **mixin** interchangably to represent a mutation of the `webpack-configurator` instance.

To end a definition simply start a different `define()` or call any of the other top-level function.

### Generator

The defined sequence is fed with `webpack-configurator` instances, created by a **generator**.

```javascript
function generator(factory():configurator, options:object):configurator|Array.<configurator>
```

The generator is passed a **factory function** which will yeild a `webpack-configurator` when called. It may be customised at initialisation or by calling the `create()` method (see creation above).

The generator has the same signature as the factory function. So where the generator is omitted the factory function will be used in its place.

If your project needs to compile several similar applications then it makes sense to specify a generator which will return an Array of configurators, one for each application.

A `clear` will remove **both** the geneartor and operations.

For example:

```javascript
webpackMultiConfigurator(...)
  .define('app')
    .generate(appGenerator);

function appGenerator(factory, options) {
  var compositions = [...];  // detect applications in your project
  return compositions
    .map((composition) => {
      return factory()
        .merge({
          name: composition.name,
          ...
        });
    });
}
```

### Operations

In the given example the generator is returning an Array of 3 configurators.

These configurators will each take independent but identical paths through the defined **operations**.

```javascript
function opeartion(configurator:configurator, options:object):configurator
```

Each is passed a configurator instance and is expected to return a configurator instance. Typically it will mutate and return the same instance. If it does not return anything then the input instance will be carried forward.

For example:

```javascript
webpackMultiConfigurator(...)
  .define('foo')
    .append(mixin);

function mixin(configurator, options) {
  return configurator
    .merge({
      ...
    });
}
```

Within each definition, operations are be unique. When there is repetition then the first instance is used.

Operators may be `append()`ed, `prepend()`ed, and `splice()`d independent of the generator.

A `clear` will remove **both** the geneartor and operations.

#### Operator Short Form

As a convenience, all the members of `webpack-configurator` are proxied on the definition.

Single statements do not need a `mixin` function, allowing the above example to be condensed:

```javascript
webpackMultiConfigurator(...)
  .define('foo')
    .merge({
      ...
    });
```

If you supply a **configurator factory** (see above) and it augments the `webpack-configurator` then its additional methods will also be proxied.

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

![](./doc/common.png?raw=true)

In this case the definition of `foo` includes all operations from the definition of `common`. The sequence is `foo's generator`, `B`, `X`, `Y`, `C`.

If `common` were used in isolation its own generator would be used. However in the context of `foo` the `common` generator is redundant, the configurator comes from `foo`.

While the operations in each definition are guaranteed unique, there is **not** a check for duplication when definitions are combined in this way.

In the example there is no generator function specified for `foo`. Should `foo` specify a generator that returns multiple configurators then each would follow identical (but separate) paths as shown.

## Inclusion

Once you have some definitions you will want to resolve them to some useful list of Webpack configuration objects.

To do this there are a number of methods:

* **`.include(name:string)`**

	Include a named definition. Any non-alphanumberic character may be used to join names so that several may be specified.

	For example, `foo+bar` will include the definition of both `foo` and `bar`.

* **`.exclude(name:string)`**

	Exclude a named definition. Any non-alphanumberic character may be used to join names so that several may be specified.

	For example, `foo+bar` will exclude the definition of both `foo` and `bar`.

	Order is important. Including, then excluding, then including a definition will result in it being included.

* **`.otherwise(name:string)`**

	Definitions to use when none are included. Any non-alphanumeric character may be used to join names so that several may be specified.

* **`.resolve()`**

	Commits the inclusions and processes definitions, resulting in a list of `webpack-configurator` instances.

	The `resolve()` method is then called on each `webpack-configurator` to bake it into a Webpack configuration object.