import React, { useState, useRef, useEffect } from 'react'
import Editor, { EditorProps, loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { parseExpression, parse } from '@babel/parser'
import { format } from './format'
import cls from 'classnames'
import './styles.less'
import './config'
import { initMonaco } from './config'

export type Monaco = typeof monaco
export interface MonacoInputProps extends EditorProps {
  helpLink?: string | boolean
  helpCode?: string
  helpCodeViewWidth?: number | string
  extraLib?: string
  onChange?: (value: string) => void
}

export const MonacoInput: React.FC<MonacoInputProps> & {
  loader?: typeof loader
} = ({
  className,
  language,
  defaultLanguage,
  width,
  helpLink,
  helpCode,
  helpCodeViewWidth,
  height,
  onMount,
  onChange,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false)
  const theme = 'light'
  const valueRef = useRef('')
  const validateRef = useRef(null)
  const submitRef = useRef(null)
  const declarationRef = useRef<string[]>([])
  const extraLibRef = useRef<monaco.IDisposable>(null)
  const monacoRef = useRef<Monaco>()
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>()
  const computedLanguage = useRef<string>(language || defaultLanguage)
  const realLanguage = useRef<string>('')
  const unmountedRef = useRef(false)
  const changedRef = useRef(false)
  const uidRef = useRef('uid___monaco__fix__later')
  const prefix = 'monaco-input'
  const input = props.value || props.defaultValue

  useEffect(() => {
    unmountedRef.current = false
    initMonaco()
    return () => {
      if (extraLibRef.current) {
        extraLibRef.current.dispose()
      }
      unmountedRef.current = true
    }
  }, [])

  useEffect(() => {
    if (monacoRef.current && props.extraLib) {
      updateExtraLib()
    }
  }, [props.extraLib])

  const updateExtraLib = () => {
    if (extraLibRef.current) {
      extraLibRef.current.dispose()
    }
    extraLibRef.current =
      monacoRef.current.languages.typescript.typescriptDefaults.addExtraLib(
        props.extraLib,
        `${uidRef.current}.d.ts`
      )
  }

  const isFileLanguage = () => {
    const lang = computedLanguage.current
    return lang === 'javascript' || lang === 'typescript'
  }

  const isExpLanguage = () => {
    const lang = computedLanguage.current
    return lang === 'javascript.expression' || lang === 'typescript.expression'
  }

  const onMountHandler = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor
    monacoRef.current = monaco
    onMount?.(editor, monaco)
    const model = editor.getModel()
    const currentValue = editor.getValue()
    model['getDesignerLanguage'] = () => computedLanguage.current
    if (currentValue) {
      format(computedLanguage.current, currentValue)
        .then((content) => {
          editor.setValue(content)
          setLoaded(true)
        })
        .catch(() => {
          setLoaded(true)
        })
    } else {
      setLoaded(true)
    }
    if (props.extraLib) {
      updateExtraLib()
    }
    editor.onDidChangeModelContent(() => {
      onChangeHandler(editor.getValue())
    })
  }

  const submit = () => {
    clearTimeout(submitRef.current)
    submitRef.current = setTimeout(() => {
      onChange?.(valueRef.current)
    }, 1000)
  }

  const validate = () => {
    if (realLanguage.current === 'typescript') {
      clearTimeout(validateRef.current)
      validateRef.current = setTimeout(() => {
        try {
          if (valueRef.current) {
            if (isFileLanguage()) {
              parse(valueRef.current, {
                sourceType: 'module',
                plugins: ['typescript', 'jsx'],
              })
            } else if (isExpLanguage()) {
              parseExpression(valueRef.current, {
                plugins: ['typescript', 'jsx'],
              })
            }
          }
          monacoRef.current.editor.setModelMarkers(
            editorRef.current.getModel(),
            computedLanguage.current,
            []
          )
          declarationRef.current = editorRef.current.deltaDecorations(
            declarationRef.current,
            [
              {
                range: new monacoRef.current.Range(1, 1, 1, 1),
                options: {},
              },
            ]
          )
          submit()
        } catch (e) {
          declarationRef.current = editorRef.current.deltaDecorations(
            declarationRef.current,
            [
              {
                range: new monacoRef.current.Range(
                  e.loc.line,
                  e.loc.column,
                  e.loc.line,
                  e.loc.column
                ),
                options: {
                  isWholeLine: true,
                  glyphMarginClassName: 'monaco-error-highline',
                },
              },
            ]
          )
          monacoRef.current.editor.setModelMarkers(
            editorRef.current.getModel(),
            computedLanguage.current,
            [
              {
                code: '1003',
                severity: 8,
                startLineNumber: e.loc.line,
                startColumn: e.loc.column,
                endLineNumber: e.loc.line,
                endColumn: e.loc.column,
                message: e.message,
              },
            ]
          )
        }
      }, 240)
    } else {
      submit()
      declarationRef.current = editorRef.current.deltaDecorations(
        declarationRef.current,
        [
          {
            range: new monacoRef.current.Range(1, 1, 1, 1),
            options: {},
          },
        ]
      )
    }
  }

  const onChangeHandler = (value: string) => {
    changedRef.current = true
    valueRef.current = value
    validate()
  }
  computedLanguage.current = language || defaultLanguage
  realLanguage.current = /(?:javascript|typescript)/gi.test(
    computedLanguage.current
  )
    ? 'typescript'
    : computedLanguage.current

  return (
    <div
      className={cls(prefix, className, {
        loaded,
      })}
      style={{ width, height }}
    >
      <div className={prefix + '-view'}>
        <Editor
          {...props}
          theme={theme === 'dark' ? 'monokai' : 'chrome-devtools'}
          defaultLanguage={realLanguage.current}
          language={realLanguage.current}
          options={{
            glyphMargin: true,
            ...props.options,
            tabSize: 2,
            smoothScrolling: true,
            scrollbar: {
              verticalScrollbarSize: 5,
              horizontalScrollbarSize: 5,
              alwaysConsumeMouseWheel: false,
            },
          }}
          value={input}
          width="100%"
          height="100%"
          onMount={onMountHandler}
        />
      </div>
    </div>
  )
}

MonacoInput.loader = loader
