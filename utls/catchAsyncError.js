// better than catch error
//tricky here is that is a two calls call for fun
// then call for the route when need it
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
