{
  'targets': [
    {
      'target_name': 'native_utils',
      'sources': [ 
        'src/native/init.cc',
        'src/native/Crypto.cc',
        'src/native/XSLT.cc'
      ],
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'xcode_settings': {
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        'MACOSX_DEPLOYMENT_TARGET': '10.7',
      },
      'msvs_settings': {
        'VCCLCompilerTool': { 'ExceptionHandling': 1 },
      },
      'conditions': [
        ['OS=="win"', { 
          'include_dirs': [ 
            "<!@(node -p \"require('node-addon-api').include\")",
            "lib/include",
            "lib/windows/include"
          ],
          'libraries': [ 
            '<(module_root_dir)/lib/windows/lib/*.lib',
            '<(module_root_dir)/lib/windows/lib/*.a'
          ],
          "dll_files": [ 
            '<(module_root_dir)/lib/windows/dll/*.dll'
          ],
          'dependencies': ["<!(node -p \"require('node-addon-api').gyp\")"]
        }],
        ['OS=="linux"', { 
          'include_dirs': [ 
            "<!@(node -p \"require('node-addon-api').include\")",
            "lib/linux/chilkat/include" 
          ],
          'libraries': [ 
            '<(module_root_dir)/lib/linux/chilkat/lib/libchilkat.a',
          ],
          'dependencies': ["<!(node -p \"require('node-addon-api').gyp\")"]
        }]
      ]
    }, {
      "target_name": "copy_binary",
      "type":"none",
      "dependencies": [ "native_utils" ],
      "copies": [
        {
          'destination': '<(module_root_dir)/dist',
          'files': ['<(module_root_dir)/build/Release/native_utils.node']
        }
      ]
    }
  ]
}