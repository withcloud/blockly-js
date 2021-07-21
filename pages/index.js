import React, { useEffect, useState } from 'react'
import Blockly from 'blockly'
import Interpreter from 'js-interpreter'

let myInterpreter = null
let runner
let demoWorkspace
let latestCode = ''
let outputArea = null

function App () {
  const [mounted, setMounted] = useState(false)

  function resetStepUi (clearOutput) {
    if (clearOutput) {
      outputArea.value = 'Program output:\n================='
    }
  }

  function generateCodeAndLoadIntoInterpreter () {
    // Generate JavaScript code and parse it.
    latestCode = Blockly.JavaScript.workspaceToCode(demoWorkspace)

    resetStepUi(true)
  }

  function resetInterpreter () {
    myInterpreter = null
    if (runner) {
      clearTimeout(runner)
      runner = null
    }
  }

  function initApi (interpreter, globalObject) {
    // Add an API function for the alert() block, generated for "text_print" blocks.
    const wrapper1 = function (text) {
      console.log('wrapper1', text)
      text = text ? text.toString() : ''
      outputArea.value = outputArea.value + '\n' + text
    }
    interpreter.setProperty(
      globalObject,
      'alert',
      interpreter.createNativeFunction(wrapper1)
    )

    // Add an API function for the prompt() block.
    const wrapper2 = function (text) {
      text = text ? text.toString() : ''
      console.log('interpreter', interpreter)
      return window.prompt(text)
    }
    interpreter.setProperty(
      globalObject,
      'prompt',
      interpreter.createNativeFunction(wrapper2)
    )
  }

  const runCode = (e) => {
    if (!myInterpreter) {
      // First statement of this code.
      // Clear the program output.
      resetStepUi(true)

      // And then show generated code in an alert.
      // In a timeout to allow the outputArea.value to reset first.
      setTimeout(function () {
        window.alert('Ready to execute the following code\n' +
          '===================================\n' +
          latestCode)

        // Begin execution
        myInterpreter = new Interpreter(latestCode, initApi)
        runner = function () {
          if (myInterpreter) {
            const hasMore = myInterpreter.run()
            if (hasMore) {
              // Execution is currently blocked by some async call.
              // Try again later.
              setTimeout(runner, 10)
            } else {
              // Program is complete.
              outputArea.value += '\n\n<< Program complete >>'
              resetInterpreter()
              resetStepUi(false)
            }
          }
        }
        runner()
      }, 1)
    }
  }

  useEffect(() => {
    if (!mounted) {
      setMounted(true)

      outputArea = document.getElementById('output')

      Blockly.Blocks.sss = {
        init: function () {
          this.appendValueInput('VALUE')
            .setCheck('String')
            .appendField('sss')
          this.setOutput(true, 'Number')
          this.setColour(160)
          this.setTooltip('Returns number of letters in the provided text.')
          this.setHelpUrl('http://www.w3schools.com/jsref/jsref_length_string.asp')
        }
      }

      const mathChangeJson = {
        type: 'html',
        message0: 'document %1 %2',
        args0: [
          {
            type: 'input_dummy'
          },
          {
            type: 'input_statement',
            name: 'content',
            check: 'document'
          }
        ],
        colour: 0,
        tooltip: '',
        helpUrl: 'http://www.w3schools.com/tags/tag_html.asp'
      }

      Blockly.Blocks.html = {
        init: function () {
          this.jsonInit(mathChangeJson)
          // Assign 'this' to a variable for use in the tooltip closure below.
          const thisBlock = this
          this.setTooltip(function () {
            return 'Add a number to variable "%1".'.replace('%1',
              thisBlock.getFieldValue('VAR'))
          })
        }
      }

      Blockly.JavaScript.sss = function (block) {
        // String or array length.
        const argument0 = Blockly.JavaScript.valueToCode(block, 'VALUE',
          Blockly.JavaScript.ORDER_FUNCTION_CALL) || '\'\''
        return [argument0 + '.length', Blockly.JavaScript.ORDER_MEMBER]
      }

      demoWorkspace = Blockly.inject('blocklyDiv', {
        toolbox: document.getElementById('toolbox')
      })

      Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'), demoWorkspace)

      // Load the interpreter now, and upon future changes.
      generateCodeAndLoadIntoInterpreter()
      demoWorkspace.addChangeListener(function (event) {
        if (!(event instanceof Blockly.Events.Ui)) {
          // Something changed. Parser needs to be reloaded.
          resetInterpreter()
          generateCodeAndLoadIntoInterpreter()
        }
      })
    }
  }, [])

  return (
    <div>
      <p>
        <button onClick={runCode} id='runButton'>Run JavaScript555555</button>
      </p>

      <div style={{ width: '100%' }}>
        <div
          id='blocklyDiv'
          style={{
            display: 'inline-block',
            height: '480px',
            width: '58%'
          }}
        />
        <textarea
          id='output' disabled='disabled'
          style={{
            display: 'inline-block',
            height: '480px',
            width: '38%'
          }}
        />
      </div>

      <xml xmlns='https://developers.google.com/blockly/xml' id='toolbox' style={{ display: 'none' }}>
        <category name='Logic' colour='%{BKY_LOGIC_HUE}'>
          <block type='controls_if' />
          <block type='logic_compare' />
          <block type='logic_operation' />
          <block type='logic_negate' />
          <block type='logic_boolean' />
        </category>
        <category name='Loops' colour='%{BKY_LOOPS_HUE}'>
          <block type='controls_repeat_ext'>
            <value name='TIMES'>
              <block type='math_number'>
                <field name='NUM'>10</field>
              </block>
            </value>
          </block>
          <block type='controls_whileUntil' />
        </category>
        <category name='Math' colour='%{BKY_MATH_HUE}'>
          <block type='math_number'>
            <field name='NUM'>123</field>
          </block>
          <block type='math_arithmetic' />
          <block type='math_single' />
        </category>
        <category name='Text' colour='%{BKY_TEXTS_HUE}'>
          <block type='text' />
          <block type='text_length' />
          <block type='sss' />
          <block type='html' />
          <block type='text_print' />
          <block type='text_prompt_ext'>
            <value name='TEXT'>
              <block type='text' />
            </value>
          </block>
        </category>
        <sep />
        <category name='Variables' custom='VARIABLE' colour='%{BKY_VARIABLES_HUE}' />
        <category name='Functions' custom='PROCEDURE' colour='%{BKY_PROCEDURES_HUE}' />
      </xml>

      <xml xmlns='https://developers.google.com/blockly/xml' id='startBlocks' style={{ display: 'none' }}>
        <block type='variables_set' id='set_n_initial' inline='true' x='20' y='20'>
          <field name='VAR'>n</field>
          <value name='VALUE'>
            <block type='math_number'>
              <field name='NUM'>1</field>
            </block>
          </value>
          <next>
            <block type='controls_repeat_ext' id='repeat' inline='true'>
              <value name='TIMES'>
                <block type='math_number'>
                  <field name='NUM'>4</field>
                </block>
              </value>
              <statement name='DO'>
                <block type='variables_set' id='set_n_update' inline='true'>
                  <field name='VAR'>n</field>
                  <value name='VALUE'>
                    <block type='math_arithmetic' inline='true'>
                      <field name='OP'>MULTIPLY</field>
                      <value name='A'>
                        <block type='variables_get'>
                          <field name='VAR'>n</field>
                        </block>
                      </value>
                      <value name='B'>
                        <block type='math_number'>
                          <field name='NUM'>2</field>
                        </block>
                      </value>
                    </block>
                  </value>
                  <next>
                    <block type='text_print' id='print'>
                      <value name='TEXT'>
                        <block type='variables_get'>
                          <field name='VAR'>n</field>
                        </block>
                      </value>
                    </block>
                  </next>
                </block>
              </statement>
            </block>
          </next>
        </block>
      </xml>

    </div>
  )
}

export default App
