require('../common');

var
  path = require('path'),
  fs = require('fs'),
  fn = path.join(fixturesDir, "write.txt"),
  file = fs.createWriteStream(fn),

  EXPECTED = '012345678910',

  callbacks = {
    open: -1,
    drain: -2,
    close: -1,
    closeCb: -1,
    write: -11,
  };

file
  .addListener('open', function(fd) {
    callbacks.open++;
    assert.equal('number', typeof fd);
  })
  .addListener('error', function(err) {
    throw err;
  })
  .addListener('drain', function() {
    callbacks.drain++;
    if (callbacks.drain == -1) {
      assert.equal(EXPECTED, fs.readFileSync(fn));
      file.write(EXPECTED);
    } else if (callbacks.drain == 0) {
      assert.equal(EXPECTED+EXPECTED, fs.readFileSync(fn));
      file.close(function(err) {
        assert.ok(!err);
        callbacks.closeCb++;
      });
    }
  })
  .addListener('close', function() {
    callbacks.close++;
    assert.throws(function() {
      file.write('should not work anymore');
    });

    fs.unlinkSync(fn);
  });

for (var i = 0; i < 11; i++) {
  (function(i) {
    assert.strictEqual(false, file.write(i, function(err, bytesWritten) {
      callbacks.write++;
      assert.equal(new String(i).length, bytesWritten);
    }));
  })(i);
}

process.addListener('exit', function() {
  for (var k in callbacks) {
    assert.equal(0, callbacks[k], k+' count off by '+callbacks[k]);
  }
});