import React, { useMemo, useState } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Paper from '@material-ui/core/Paper';
import Card from '@material-ui/core/Card';
import Container from '@material-ui/core/Container';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Button, TextField } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  main: {
    marginTop: theme.spacing(8)
  },
  item: {
    margin: theme.spacing(2, 0, 0)
  },
  submit: {
    margin: theme.spacing(2, 0, 0),
  },
}));

function App() {
  const classes = useStyles();

  const [responses, setResponses] = useState([] as string[])
  const [toSend, setToSend] = useState('')

  const doSend = useMemo(() => () => {
    responses.push(toSend)
    setResponses(responses)
    setToSend('')
  }, [ toSend ]);

  return (
    <Container component="main" className={classes.main} maxWidth="sm">
      <CssBaseline />
      <Typography className={classes.item} variant="h4" component="h1">
        Websocket test
      </Typography>
      <Typography className={classes.item} variant="h5" component="h2">
        Send something
      </Typography>
      <TextField className={classes.item} label="What to send" multiline variant="outlined" style={{ width: "100%" }} 
        value={toSend} onChange={e => setToSend(e.target.value)}/>
      <Button className={classes.submit} variant="contained" color="primary"
        onClick={() => doSend()}>Send</Button>
      <Typography className={classes.item} variant="h5" component="h2">
        You got something
      </Typography>
      {responses.map(response => (
        <Typography className={classes.item} variant="body1">{response}</Typography>
      ))}
    </Container>
  );
}

export default App;
